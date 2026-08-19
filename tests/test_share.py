"""Tests for /share. Firestore calls are monkeypatched so these run without
live credentials — see test_share_endpoints_survive_firestore_outage for the
one case that intentionally exercises the real failure path."""
from fastapi.testclient import TestClient

from app.main import app
from app.services import firebase_service

client = TestClient(app)


def test_share_rejects_empty_html():
    res = client.post("/share", json={"transformed_html": "  ", "original_url": "https://x.com"})
    assert res.status_code == 400


def test_share_rejects_oversized_html():
    huge_html = "<p>" + ("a" * 1_000_000) + "</p>"
    res = client.post("/share", json={"transformed_html": huge_html, "original_url": "https://x.com"})
    assert res.status_code == 413


def test_get_missing_share_returns_404(monkeypatch):
    async def fake_get_document(collection, doc_id):
        return None

    monkeypatch.setattr(firebase_service, "get_document", fake_get_document)
    res = client.get("/share/does-not-exist")
    assert res.status_code == 404


def test_get_share_returns_stored_record(monkeypatch):
    async def fake_get_document(collection, doc_id):
        assert collection == "shares"
        assert doc_id == "abc123"
        return {"transformed_html": "<h1>hi</h1>", "original_url": "https://x.com", "created_at": 1.0}

    monkeypatch.setattr(firebase_service, "get_document", fake_get_document)
    res = client.get("/share/abc123")
    assert res.status_code == 200
    assert res.json()["transformed_html"] == "<h1>hi</h1>"


def test_share_endpoints_survive_firestore_outage(monkeypatch):
    async def boom(*args, **kwargs):
        raise RuntimeError("firestore unreachable")

    monkeypatch.setattr(firebase_service, "get_document", boom)
    res = client.get("/share/whatever")
    assert res.status_code == 503
