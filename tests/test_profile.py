"""Tests for /save-profile and /get-profile, including the Firestore-outage path."""
from fastapi.testclient import TestClient

from app.main import app
from app.services import firebase_service

client = TestClient(app)


def test_save_profile_survives_firestore_outage(monkeypatch):
    async def boom(*args, **kwargs):
        raise RuntimeError("firestore unreachable")

    monkeypatch.setattr(firebase_service, "set_document", boom)
    res = client.post("/save-profile", json={"uid": "u1", "profile": {"disability": "none"}})
    assert res.status_code == 503


def test_get_profile_survives_firestore_outage(monkeypatch):
    async def boom(*args, **kwargs):
        raise RuntimeError("firestore unreachable")

    monkeypatch.setattr(firebase_service, "get_document", boom)
    res = client.get("/get-profile/u1")
    assert res.status_code == 503


def test_get_profile_returns_empty_dict_when_missing(monkeypatch):
    async def fake_get_document(collection, doc_id):
        return None

    monkeypatch.setattr(firebase_service, "get_document", fake_get_document)
    res = client.get("/get-profile/u1")
    assert res.status_code == 200
    assert res.json() == {}
