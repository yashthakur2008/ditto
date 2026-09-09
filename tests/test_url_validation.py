"""Tests for URL validation (SSRF protection)."""
import pytest

from app.services.url_validation import URLValidationError, validate_fetch_url


def test_accepts_public_https_url():
    # example.com resolves to a public IP in most environments
    url = validate_fetch_url("https://example.com/page")
    assert url == "https://example.com/page"


def test_rejects_missing_scheme():
    with pytest.raises(URLValidationError, match="http and https"):
        validate_fetch_url("example.com")


def test_rejects_localhost():
    with pytest.raises(URLValidationError, match="Local"):
        validate_fetch_url("http://localhost:8080/admin")


def test_rejects_private_ip_literal():
    with pytest.raises(URLValidationError, match="Private"):
        validate_fetch_url("http://192.168.1.1/internal")


def test_rejects_empty_url():
    with pytest.raises(URLValidationError, match="No URL"):
        validate_fetch_url("")


def test_school_mode_accepts_allowed_domain(monkeypatch):
    from app.services import url_validation

    monkeypatch.setattr(url_validation.settings, "school_mode", True)
    monkeypatch.setattr(url_validation.settings, "school_allowed_domains", "example.com,.khanacademy.org")

    assert validate_fetch_url("https://www.example.com/page") == "https://www.example.com/page"
    assert validate_fetch_url("https://learn.khanacademy.org/math") == "https://learn.khanacademy.org/math"


def test_school_mode_rejects_unapproved_domain(monkeypatch):
    from app.services import url_validation

    monkeypatch.setattr(url_validation.settings, "school_mode", True)
    monkeypatch.setattr(url_validation.settings, "school_allowed_domains", "example.edu")

    with pytest.raises(URLValidationError, match="not approved"):
        validate_fetch_url("https://example.com/page")
