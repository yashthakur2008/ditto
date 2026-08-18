from fastapi import APIRouter
from app.config import settings

router = APIRouter(tags=["health"])


@router.get("/health")
def health() -> dict:
    return {
        "status": "ok",
        "model": settings.gemini_model,
        "config": {
            "gemini": bool(settings.gemini_api_key),
            "elevenlabs": bool(settings.elevenlabs_api_key),
            "playwright": True,
            "firestore": bool(settings.firebase_project_id),
            "maps": bool(settings.google_maps_api_key),
        },
    }
