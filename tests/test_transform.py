"""Tests for transform endpoint error paths."""
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_transform_rejects_invalid_url():
    res = client.post(
        "/transform",
        json={"url": "not-a-url", "profile": {"disability": "none", "age": 30}},
    )
    assert res.status_code == 400


def test_transform_rejects_localhost():
    res = client.post(
        "/transform",
        json={"url": "http://127.0.0.1/secret", "profile": {"disability": "none", "age": 30}},
    )
    assert res.status_code == 400


def test_chat_requires_messages():
    res = client.post("/chat", json={"messages": [], "preferences": {}})
    assert res.status_code == 422
