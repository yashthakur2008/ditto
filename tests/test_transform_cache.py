"""Tests for the in-memory transform result cache."""
from app.models.schemas import TransformProfile
from app.services import transform_service as ts


def test_cache_key_is_deterministic():
    profile = TransformProfile(disability="blind", age=40)
    k1 = ts._cache_key("https://example.com", profile, "note")
    k2 = ts._cache_key("https://example.com", profile, "note")
    assert k1 == k2


def test_cache_key_differs_by_profile():
    k_blind = ts._cache_key("https://example.com", TransformProfile(disability="blind"), None)
    k_deaf = ts._cache_key("https://example.com", TransformProfile(disability="deaf"), None)
    assert k_blind != k_deaf


def test_cache_key_differs_by_url():
    profile = TransformProfile()
    k1 = ts._cache_key("https://a.com", profile, None)
    k2 = ts._cache_key("https://b.com", profile, None)
    assert k1 != k2


def test_cache_set_and_get_roundtrip():
    ts._cache.clear()
    key = ts._cache_key("https://roundtrip.example", TransformProfile(), None)
    value = ("<html>rebuilt</html>", "safe", {"total": 40}, {"total": 90}, "<html>orig</html>")
    ts._cache_set(key, value)
    assert ts._cache_get(key) == value


def test_cache_miss_returns_none():
    ts._cache.clear()
    key = ts._cache_key("https://never-cached.example", TransformProfile(), None)
    assert ts._cache_get(key) is None


def test_cache_expires_after_ttl():
    ts._cache.clear()
    key = ts._cache_key("https://expiring.example", TransformProfile(), None)
    value = ("html", "safe", {}, {}, "orig")
    ts._cache_set(key, value)
    # Force the entry into the past so it reads as expired.
    _, stored_value = ts._cache[key]
    ts._cache[key] = (0.0, stored_value)
    assert ts._cache_get(key) is None
    assert key not in ts._cache


def test_cache_evicts_oldest_when_over_capacity():
    ts._cache.clear()
    original_max = ts._CACHE_MAX_ENTRIES
    ts._CACHE_MAX_ENTRIES = 3
    try:
        keys = [ts._cache_key(f"https://site{i}.example", TransformProfile(), None) for i in range(4)]
        for k in keys:
            ts._cache_set(k, ("html", "safe", {}, {}, "orig"))
        assert len(ts._cache) == 3
        assert keys[0] not in ts._cache  # oldest evicted
        assert keys[-1] in ts._cache      # newest kept
    finally:
        ts._CACHE_MAX_ENTRIES = original_max
        ts._cache.clear()
