"""Tests for the school pilot reading-list scaffold."""
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_pilot_privacy_notice_is_plain_language_and_minimizes_data():
    res = client.get("/pilot/privacy-notice")
    assert res.status_code == 200
    data = res.json()
    assert data["audience"] == "both"
    assert "privacy notice" in data["title"].lower()
    assert "not to monitor students" in data["summary"]
    assert "approved reading URL" in data["data_collected"]
    assert "full browsing history" in data["data_not_collected"]
    assert "in-memory" in data["retention_note"]
    assert "review this notice" in data["consent_note"]


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


def test_pilot_reading_list_summary_gives_readiness_next_step():
    res = client.post(
        "/pilot/reading-list",
        json={
            "name": "Mixed readings",
            "reviewer": "Pilot lead",
            "urls": ["https://example.com/article", "http://localhost:8080/private"],
        },
    )
    assert res.status_code == 200
    pilot_id = res.json()["pilot_id"]

    summary_res = client.get(f"/pilot/reading-list/{pilot_id}/summary")
    assert summary_res.status_code == 200
    summary = summary_res.json()
    assert summary["pilot_id"] == pilot_id
    assert summary["total_urls"] == 2
    assert summary["ready_count"] == 1
    assert summary["blocked_count"] == 1
    assert summary["readiness_rate"] == 0.5
    assert summary["ready_domains"] == ["example.com"]
    assert summary["blocked_domains"] == ["localhost"]
    assert summary["duplicate_url_count"] == 0
    assert "Review blocked URLs" in summary["recommended_next_step"]


def test_pilot_reading_list_summary_flags_duplicate_urls():
    res = client.post(
        "/pilot/reading-list",
        json={
            "name": "Duplicate readings",
            "urls": ["https://example.com/article", "https://example.com/article"],
        },
    )
    assert res.status_code == 200
    pilot_id = res.json()["pilot_id"]

    summary_res = client.get(f"/pilot/reading-list/{pilot_id}/summary")
    assert summary_res.status_code == 200
    summary = summary_res.json()
    assert summary["duplicate_url_count"] == 1
    assert summary["ready_domains"] == ["example.com"]
    assert "Remove duplicate URLs" in summary["recommended_next_step"]


def test_missing_pilot_summary_returns_404():
    res = client.get("/pilot/reading-list/notfound/summary")
    assert res.status_code == 404


def test_pilot_reading_list_exports_csv_report():
    res = client.post(
        "/pilot/reading-list",
        json={
            "name": "CSV readings",
            "reviewer": "Pilot lead",
            "profile_categories": ["adhd"],
            "urls": ["https://example.com/article", "http://localhost:8080/private"],
        },
    )
    assert res.status_code == 200
    pilot_id = res.json()["pilot_id"]

    csv_res = client.get(f"/pilot/reading-list/{pilot_id}/report.csv")
    assert csv_res.status_code == 200
    assert csv_res.headers["content-type"].startswith("text/csv")
    assert f"ditto-pilot-{pilot_id}.csv" in csv_res.headers["content-disposition"]
    body = csv_res.text
    assert "pilot_id,name,reviewer,url,status,approved_domain" in body
    assert f"{pilot_id},CSV readings,Pilot lead,https://example.com/article,ready,example.com,adhd" in body
    assert "http://localhost:8080/private,blocked" in body


def test_missing_pilot_csv_report_returns_404():
    res = client.get("/pilot/reading-list/notfound/report.csv")
    assert res.status_code == 404


def test_missing_pilot_reading_list_returns_404():
    res = client.get("/pilot/reading-list/notfound")
    assert res.status_code == 404


