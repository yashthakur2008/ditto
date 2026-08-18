import firebase_admin
from firebase_admin import credentials, firestore
from app.config import settings
from typing import Any

_app: firebase_admin.App | None = None


def _init() -> None:
    global _app
    if _app:
        return
    if settings.google_application_credentials:
        cred = credentials.Certificate(settings.google_application_credentials)
        _app = firebase_admin.initialize_app(cred, {"projectId": settings.firebase_project_id})
    else:
        # On Cloud Run, ADC (Application Default Credentials) picks up the service account automatically
        _app = firebase_admin.initialize_app(options={"projectId": settings.firebase_project_id})


def get_db() -> firestore.AsyncClient:
    _init()
    return firestore.AsyncClient(project=settings.firebase_project_id)


async def set_document(collection: str, doc_id: str, data: dict[str, Any]) -> None:
    db = get_db()
    await db.collection(collection).document(doc_id).set(data)


async def get_document(collection: str, doc_id: str) -> dict[str, Any] | None:
    db = get_db()
    doc = await db.collection(collection).document(doc_id).get()
    return doc.to_dict() if doc.exists else None


async def list_collection(collection: str, limit: int = 20) -> list[dict[str, Any]]:
    db = get_db()
    docs = db.collection(collection).limit(limit).stream()
    return [doc.to_dict() async for doc in docs]


async def query_by_field(
    collection: str, field: str, value: Any, order_by: str | None = None, limit: int = 20
) -> list[dict[str, Any]]:
    db = get_db()
    query = db.collection(collection).where(field, "==", value)
    if order_by:
        query = query.order_by(order_by, direction=firestore.Query.DESCENDING)
    docs = query.limit(limit).stream()
    return [doc.to_dict() async for doc in docs]
