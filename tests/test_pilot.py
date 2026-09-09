"""Tests for the school pilot reading-list scaffold."""
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_pilot_reading_list_validates_and_stores_public_urls():
    res = client.post(
        "/pilot/reading-list",
        json={
            "name": "Week 1 readings",
            "reviewer": "Accessibility team",
            "profile_categories": ["dyslexia", "adhd"],
            "urls": ["https://example.com/article"],
        },
    )
    assert res.status_code == 200
    data = res.json()
    assert data["name"] == "Week 1 readings"
    assert data["reviewer"] == "Accessibility team"
    assert data["total_urls"] == 1
    assert data["ready_count"] == 1
    assert data["blocked_count"] == 0
    assert data["items"][0]["status"] == "ready"
    assert data["items"][0]["approved_domain"] == "example.com"
    assert data["items"][0]["profile_categories"] == ["dyslexia", "adhd"]

    stored = client.get(f"/pilot/reading-list/{data['pilot_id']}")
    assert stored.status_code == 200
    assert stored.json()["pilot_id"] == data["pilot_id"]


def test_pilot_reading_list_reports_blocked_urls_per_item():
    res = client.post(
        "/pilot/reading-list",
        json={"name": "Unsafe readings", "urls": ["http://localhost:8080/private"]},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["ready_count"] == 0
    assert data["blocked_count"] == 1
    assert data["items"][0]["status"] == "blocked"
    assert "Local and loopback" in data["items"][0]["error"]


def test_pilot_reading_list_rejects_empty_list():
    res = client.post("/pilot/reading-list", json={"name": "Empty", "urls": []})
    assert res.status_code == 400
    assert "at least one" in res.json()["detail"]


def test_missing_pilot_reading_list_returns_404():
    res = client.get("/pilot/reading-list/notfound")
    assert res.status_code == 404
