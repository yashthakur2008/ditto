import asyncio
import time
import traceback
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.models.schemas import (
    TransformRequest,
    TransformResponse,
    SaveProfileRequest,
    HistoryItem,
    BatchTransformRequest,
    BatchTransformResponse,
    BatchTransformResult,
    TransformProfile,
)
from app.services import transform_service, compliance_service, firebase_service
from app.services.url_validation import URLValidationError, validate_fetch_url

router = APIRouter(tags=["transform"])

MAX_BATCH_URLS = 10
BATCH_CONCURRENCY = 3


async def _log_transform(
    url: str,
    profile: TransformProfile,
    content_level: str,
    uid: str | None,
    before_score: dict | None = None,
    after_score: dict | None = None,
) -> None:
    """Fire-and-forget analytics + opt-in history logging — never raises."""
    now = time.time()
    try:
        await firebase_service.set_document(
            "transform_logs",
            f"{int(now)}_{abs(hash(url)) % 99999}",
            {
                "url": url,
                "disability": profile.disability,
                "age": profile.age,
                "country": profile.country,
                "content_level": content_level,
                "success": True,
            },
        )
    except Exception:
        pass

    if uid:
        try:
            await firebase_service.set_document(
                "history",
                f"{uid}_{int(now * 1000)}",
                {
                    "uid": uid,
                    "url": url,
                    "disability": profile.disability,
                    "content_level": content_level,
                    "created_at": now,
                    "before_score_total": (before_score or {}).get("total"),
                    "after_score_total": (after_score or {}).get("total"),
                },
            )
        except Exception:
            pass


# ── /transform ─────────────────────────────────────────────────────────────────

@router.post("/transform", response_model=TransformResponse)
async def transform(req: TransformRequest) -> TransformResponse:
    profile = req.profile
    compliance_note = compliance_service.get_compliance_note(profile.country)

    try:
        safe_url = validate_fetch_url(req.url)
    except URLValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))

    try:
        html, content_level, before_score, after_score, original_html = await transform_service.transform(
            safe_url, profile, compliance_note
        )
    except Exception as e:
        detail = f"{type(e).__name__}: {e}\n{traceback.format_exc()}"
        print(detail)
        raise HTTPException(status_code=500, detail=f"{type(e).__name__}: {e}" or "Unknown error")

    await _log_transform(req.url, profile, content_level, req.uid, before_score, after_score)

    return TransformResponse(
        transformed_html=html,
        original_url=req.url,
        profile=profile,
        compliance_note=compliance_note,
        content_level=content_level,
        before_score=before_score,
        after_score=after_score,
        original_html=original_html,
    )


# ── /transform/batch ───────────────────────────────────────────────────────────

@router.post("/transform/batch", response_model=BatchTransformResponse)
async def transform_batch(req: BatchTransformRequest) -> BatchTransformResponse:
    """
    Rebuild several URLs with the same profile — e.g. auditing all the key
    pages on a site. Runs with bounded concurrency so a large batch doesn't
    spin up too many headless-browser scrapes at once.
    """
    if not req.urls:
        raise HTTPException(status_code=400, detail="Provide at least one URL.")
    if len(req.urls) > MAX_BATCH_URLS:
        raise HTTPException(status_code=400, detail=f"Batches are limited to {MAX_BATCH_URLS} URLs.")

    profile = req.profile
    compliance_note = compliance_service.get_compliance_note(profile.country)
    semaphore = asyncio.Semaphore(BATCH_CONCURRENCY)

    async def run_one(url: str) -> BatchTransformResult:
        async with semaphore:
            try:
                safe_url = validate_fetch_url(url)
            except URLValidationError as e:
                return BatchTransformResult(url=url, success=False, error=str(e))

            try:
                html, content_level, before_score, after_score, _ = await transform_service.transform(
                    safe_url, profile, compliance_note
                )
            except Exception as e:
                return BatchTransformResult(url=url, success=False, error=f"{type(e).__name__}: {e}")

            await _log_transform(url, profile, content_level, req.uid, before_score, after_score)

            return BatchTransformResult(
                url=url,
                success=True,
                transformed_html=html,
                content_level=content_level,
                before_score=before_score,
                after_score=after_score,
            )

    results = await asyncio.gather(*(run_one(u) for u in req.urls))
    return BatchTransformResponse(results=list(results))


# ── /classify ─────────────────────────────────────────────────────────────────

class ClassifyRequest(BaseModel):
    url: str
    age: int = 30


class ClassifyResponse(BaseModel):
    level: str   # safe | mild | hardcore
    reason: str
    blocked: bool


@router.post("/classify", response_model=ClassifyResponse)
async def classify(req: ClassifyRequest) -> ClassifyResponse:
    """
    Quick pre-flight check — tells the extension whether a page is safe for
    this user's age BEFORE running the full transform.
    """
    if req.age >= 18:
        return ClassifyResponse(level="safe", reason="User is an adult.", blocked=False)

    try:
        safe_url = validate_fetch_url(req.url)
        html = await transform_service.scrape(safe_url)
        level, reason = await transform_service.classify_content(html)
    except URLValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return ClassifyResponse(
        level=level,
        reason=reason,
        blocked=(level == "hardcore"),
    )


# ── /score ────────────────────────────────────────────────────────────────────

class ScoreRequest(BaseModel):
    url: str


@router.post("/score")
async def score_url(req: ScoreRequest) -> dict:
    """Score a URL's accessibility without transforming it."""
    from app.services import score_service

    try:
        safe_url = validate_fetch_url(req.url)
        html = await transform_service.scrape(safe_url)
        return await score_service.score(html)
    except URLValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── /save-profile  /get-profile ────────────────────────────────────────────────

@router.post("/save-profile")
async def save_profile(req: SaveProfileRequest) -> dict:
    try:
        await firebase_service.set_document("users", req.uid, req.profile)
    except Exception:
        raise HTTPException(status_code=503, detail="Couldn't save your profile right now — try again shortly.")
    return {"status": "saved"}


@router.get("/get-profile/{uid}")
async def get_profile(uid: str) -> dict:
    try:
        doc = await firebase_service.get_document("users", uid)
    except Exception:
        raise HTTPException(status_code=503, detail="Couldn't load your profile right now — try again shortly.")
    return doc or {}


# ── /history ──────────────────────────────────────────────────────────────────

@router.get("/history/{uid}", response_model=list[HistoryItem])
async def get_history(uid: str, limit: int = 20) -> list[dict]:
    """Most recent transformed URLs for this user, newest first."""
    try:
        return await firebase_service.query_by_field(
            "history", "uid", uid, order_by="created_at", limit=limit
        )
    except Exception:
        return []


@router.get("/history/{uid}/report")
async def get_history_report(uid: str, limit: int = 200):
    """
    Downloadable CSV audit trail — every page this user rebuilt, with its
    before/after accessibility score, for citing improvements or record-keeping.
    """
    import csv
    import io
    from datetime import datetime, timezone
    from fastapi.responses import Response

    try:
        rows = await firebase_service.query_by_field(
            "history", "uid", uid, order_by="created_at", limit=limit
        )
    except Exception:
        rows = []

    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(["date", "url", "disability_profile", "content_level", "before_score", "after_score"])
    for row in rows:
        created_at = row.get("created_at")
        date_str = (
            datetime.fromtimestamp(created_at, tz=timezone.utc).isoformat()
            if isinstance(created_at, (int, float))
            else ""
        )
        writer.writerow([
            date_str,
            row.get("url", ""),
            row.get("disability", ""),
            row.get("content_level", ""),
            row.get("before_score_total", ""),
            row.get("after_score_total", ""),
        ])

    return Response(
        content=buf.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="ditto-history-{uid}.csv"'},
    )
