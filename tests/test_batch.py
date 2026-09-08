"""Tests for /transform/batch validation paths (no network LLM calls)."""
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_batch_rejects_empty_url_list():
    res = client.post("/transform/batch", json={"urls": []})
    assert res.status_code == 400


def test_batch_rejects_too_many_urls():
    res = client.post("/transform/batch", json={"urls": [f"https://example.com/{i}" for i in range(11)]})
    assert res.status_code == 400


def test_batch_reports_per_url_validation_errors():
    res = client.post("/transform/batch", json={"urls": ["not-a-url", "http://127.0.0.1/secret"]})
    assert res.status_code == 200
    results = res.json()["results"]
    assert len(results) == 2
    assert all(r["success"] is False for r in results)
