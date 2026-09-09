import asyncio
import csv
import hashlib
import io
import time
import traceback
from urllib.parse import urlparse
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from app.models.schemas import (
    TransformRequest,
    TransformResponse,
    SaveProfileRequest,
    HistoryItem,
    BatchTransformRequest,
    BatchTransformResponse,
    BatchTransformResult,
    PilotReadingItem,
    PilotReadingListRequest,
    PilotReadingListResponse,
    PilotReadinessSummary,
    PilotPrivacyNotice,
    PilotLaunchChecklist,
    PilotChecklistItem,
    TransformProfile,
)
from app.config import settings
from app.services import transform_service, compliance_service, firebase_service
from app.services.url_validation import URLValidationError, validate_fetch_url

router = APIRouter(tags=["transform"])

MAX_BATCH_URLS = 10
BATCH_CONCURRENCY = 3
MAX_PILOT_URLS = 50
_pilot_reading_lists: dict[str, PilotReadingListResponse] = {}


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


# ── /pilot/reading-list ───────────────────────────────────────────────────────


@router.get("/pilot/privacy-notice", response_model=PilotPrivacyNotice)
async def get_pilot_privacy_notice() -> PilotPrivacyNotice:
    """Plain-language privacy copy for school pilot coordinators and students."""
    return PilotPrivacyNotice(
        title="Ditto school pilot privacy notice",
        summary=(
            "Ditto uses approved reading URLs and optional accessibility preferences "
            "to create easier-to-read versions of school content. Pilot reports are "
            "designed to measure readiness and accessibility outcomes, not to monitor students."
        ),
        data_collected=[
            "approved reading URL",
            "selected accessibility profile categories",
            "transform status and timestamps",
            "before/after accessibility score totals when a transform runs",
        ],
        data_not_collected=[
            "passwords or private course logins",
            "medical documentation",
            "full browsing history",
            "payment information during pilots",
        ],
        retention_note="Pilot scaffold data is in-memory in local/demo mode until school-approved persistence is configured.",
        consent_note="Students and coordinators should review this notice before a pilot and use only approved course readings.",
    )


@router.get("/pilot/launch-checklist", response_model=PilotLaunchChecklist)
async def get_pilot_launch_checklist() -> PilotLaunchChecklist:
    """Coordinator checklist for launching a small school pilot safely."""
    return PilotLaunchChecklist(
        title="Ditto school pilot launch checklist",
        items=[
            PilotChecklistItem(id="privacy_notice", label="Share the Ditto pilot privacy notice with students and coordinators.", owner="coordinator"),
            PilotChecklistItem(id="approved_readings", label="Submit only school-approved public reading URLs.", owner="coordinator"),
            PilotChecklistItem(id="student_profiles", label="Collect only the accessibility profile categories needed for the pilot.", owner="coordinator"),
            PilotChecklistItem(id="url_readiness", label="Confirm the reading-list summary has no blocked or duplicate URLs before launch.", owner="ditto"),
            PilotChecklistItem(id="student_consent", label="Confirm student consent and explain that Ditto is not monitoring browsing history.", owner="coordinator"),
            PilotChecklistItem(id="feedback_window", label="Schedule a short student feedback window after the first reading batch.", owner="coordinator"),
        ],
    )


def _pilot_id(name: str, urls: list[str]) -> str:
    payload = "\n".join([name.strip(), *[u.strip() for u in urls]])
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()[:12]


@router.post("/pilot/reading-list", response_model=PilotReadingListResponse)
async def create_pilot_reading_list(req: PilotReadingListRequest) -> PilotReadingListResponse:
    """
    Validate a school pilot reading list without transforming pages yet.

    This is a startup-readiness scaffold: coordinators can prove a reading
    list is safe/approved before spending scrape or LLM budget. It intentionally
    stores only in-process metadata for now; auth, persistence, and reviewer
    workflows belong in the next pilot milestone.
    """
    name = req.name.strip() or "Untitled reading list"
    urls = [u.strip() for u in req.urls if u.strip()]
    if not urls:
        raise HTTPException(status_code=400, detail="Provide at least one reading URL.")
    if len(urls) > MAX_PILOT_URLS:
        raise HTTPException(status_code=400, detail=f"Pilot reading lists are limited to {MAX_PILOT_URLS} URLs.")

    categories = [c.strip() for c in req.profile_categories if c.strip()]
    items: list[PilotReadingItem] = []
    for url in urls:
        try:
            safe_url = validate_fetch_url(url)
            host = (urlparse(safe_url).hostname or "").lower()
            items.append(
                PilotReadingItem(
                    url=safe_url,
                    status="ready",
                    approved_domain=host,
                    profile_categories=categories,
                )
            )
        except URLValidationError as e:
            items.append(
                PilotReadingItem(
                    url=url,
                    status="blocked",
                    error=str(e),
                    profile_categories=categories,
                )
            )

    response = PilotReadingListResponse(
        pilot_id=_pilot_id(name, urls),
        name=name,
        reviewer=req.reviewer.strip(),
        total_urls=len(items),
        ready_count=sum(1 for item in items if item.status == "ready"),
        blocked_count=sum(1 for item in items if item.status == "blocked"),
        school_mode=settings.school_mode,
        items=items,
    )
    _pilot_reading_lists[response.pilot_id] = response
    return response


def _pilot_summary(record: PilotReadingListResponse) -> PilotReadinessSummary:
    readiness_rate = round(record.ready_count / record.total_urls, 3) if record.total_urls else 0.0
    normalized_urls = [item.url.strip().lower() for item in record.items]
    duplicate_url_count = len(normalized_urls) - len(set(normalized_urls))
    ready_domains = sorted(
        {
            item.approved_domain
            for item in record.items
            if item.status == "ready" and item.approved_domain
        }
    )
    blocked_domains = sorted(
        {
            (urlparse(item.url).hostname or "unknown").lower()
            for item in record.items
            if item.status == "blocked"
        }
    )
    if duplicate_url_count:
        recommended_next_step = "Remove duplicate URLs to reduce pilot cost, then review any blocked readings."
    elif record.ready_count == record.total_urls:
        recommended_next_step = "Ready to run a small transform pilot with these readings."
    elif record.ready_count == 0:
        recommended_next_step = "Replace blocked URLs before inviting students."
    else:
        recommended_next_step = "Review blocked URLs, then run the ready readings as the first pilot batch."

    return PilotReadinessSummary(
        pilot_id=record.pilot_id,
        name=record.name,
        reviewer=record.reviewer,
        total_urls=record.total_urls,
        ready_count=record.ready_count,
        blocked_count=record.blocked_count,
        readiness_rate=readiness_rate,
        ready_domains=ready_domains,
        blocked_domains=blocked_domains,
        duplicate_url_count=duplicate_url_count,
        recommended_next_step=recommended_next_step,
    )


@router.get("/pilot/reading-list/{pilot_id}", response_model=PilotReadingListResponse)
async def get_pilot_reading_list(pilot_id: str) -> PilotReadingListResponse:
    record = _pilot_reading_lists.get(pilot_id)
    if record is None:
        raise HTTPException(status_code=404, detail="Pilot reading list not found.")
    return record


@router.get("/pilot/reading-list/{pilot_id}/summary", response_model=PilotReadinessSummary)
async def get_pilot_readiness_summary(pilot_id: str) -> PilotReadinessSummary:
    record = _pilot_reading_lists.get(pilot_id)
    if record is None:
        raise HTTPException(status_code=404, detail="Pilot reading list not found.")
    return _pilot_summary(record)


@router.get("/pilot/reading-list/{pilot_id}/report.csv")
async def export_pilot_reading_list_csv(pilot_id: str) -> StreamingResponse:
    """Export a coordinator-friendly pilot readiness report."""
    record = _pilot_reading_lists.get(pilot_id)
    if record is None:
        raise HTTPException(status_code=404, detail="Pilot reading list not found.")

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(
        [
            "pilot_id",
            "name",
            "reviewer",
            "url",
            "status",
            "approved_domain",
            "profile_categories",
            "before_score_total",
            "after_score_total",
            "error",
        ]
    )
    for item in record.items:
        writer.writerow(
            [
                record.pilot_id,
                record.name,
                record.reviewer,
                item.url,
                item.status,
                item.approved_domain or "",
                ";".join(item.profile_categories),
                "" if item.before_score_total is None else item.before_score_total,
                "" if item.after_score_total is None else item.after_score_total,
                item.error or "",
            ]
        )

    filename = f"ditto-pilot-{record.pilot_id}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


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
