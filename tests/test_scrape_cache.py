"""Tests for the per-URL scrape/score cache that lets a re-rebuild with a
different profile skip the browser render and the original-page scoring call."""
from app.services import transform_service as ts


def test_get_scraped_reuses_cached_record(monkeypatch):
    ts._scrape_cache.clear()
    calls = {"scrape": 0, "score": 0}

    async def fake_scrape(url):
        calls["scrape"] += 1
        return f"<html>{url}</html>"

    async def fake_score(html):
        calls["score"] += 1
        return {"total": 42}

    monkeypatch.setattr(ts, "scrape", fake_scrape)
    monkeypatch.setattr(ts.score_service, "score", fake_score)

    import asyncio

    record1 = asyncio.run(ts._get_scraped("https://example.com"))
    record2 = asyncio.run(ts._get_scraped("https://example.com"))

    assert record1 is record2
    assert calls["scrape"] == 1
    assert calls["score"] == 1


def test_get_scraped_lazily_fills_content_level():
    ts._scrape_cache.clear()
    record = {"html": "<p>hi</p>", "before_score": {"total": 1}, "content_level": None, "content_reason": ""}
    ts._scrape_cache["https://x.example"] = (ts.time.time() + 60, record)

    import asyncio

    fetched = asyncio.run(ts._get_scraped("https://x.example"))
    assert fetched["content_level"] is None  # not filled until a minor's profile asks for it


def test_get_scraped_expired_entry_is_refetched(monkeypatch):
    ts._scrape_cache.clear()
    calls = {"scrape": 0}

    async def fake_scrape(url):
        calls["scrape"] += 1
        return "<html>fresh</html>"

    async def fake_score(html):
        return {"total": 1}

    monkeypatch.setattr(ts, "scrape", fake_scrape)
    monkeypatch.setattr(ts.score_service, "score", fake_score)

    stale_record = {"html": "<html>stale</html>", "before_score": {"total": 0}, "content_level": None, "content_reason": ""}
    ts._scrape_cache["https://stale.example"] = (0.0, stale_record)  # already expired

    import asyncio

    fetched = asyncio.run(ts._get_scraped("https://stale.example"))
    assert fetched["html"] == "<html>fresh</html>"
    assert calls["scrape"] == 1
