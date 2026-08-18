import time
import uuid

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services import firebase_service

router = APIRouter(tags=["share"])

# Firestore documents cap out at 1 MiB; leave headroom for the rest of the
# record (url, timestamp) and Firestore's own field overhead.
MAX_SHARE_HTML_BYTES = 900_000


class ShareRequest(BaseModel):
    transformed_html: str
    original_url: str


class ShareResponse(BaseModel):
    id: str


class ShareRecord(BaseModel):
    transformed_html: str
    original_url: str
    created_at: float


@router.post("/share", response_model=ShareResponse)
async def create_share(req: ShareRequest) -> ShareResponse:
    if not req.transformed_html.strip():
        raise HTTPException(status_code=400, detail="Nothing to share yet.")
    if len(req.transformed_html.encode("utf-8")) > MAX_SHARE_HTML_BYTES:
        raise HTTPException(status_code=413, detail="This rebuilt page is too large to share.")

    share_id = uuid.uuid4().hex[:10]
    await firebase_service.set_document(
        "shares",
        share_id,
        {
            "transformed_html": req.transformed_html,
            "original_url": req.original_url,
            "created_at": time.time(),
        },
    )
    return ShareResponse(id=share_id)


@router.get("/share/{share_id}", response_model=ShareRecord)
async def get_share(share_id: str) -> ShareRecord:
    doc = await firebase_service.get_document("shares", share_id)
    if not doc:
        raise HTTPException(status_code=404, detail="This shared page doesn't exist or has expired.")
    return ShareRecord(**doc)
