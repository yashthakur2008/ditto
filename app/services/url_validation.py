"""
Validate user-supplied URLs before fetching them server-side (SSRF protection).
"""
import ipaddress
import socket
from urllib.parse import urlparse

from app.config import settings

_BLOCKED_HOSTS = frozenset({"localhost", "127.0.0.1", "0.0.0.0", "::1"})


class URLValidationError(ValueError):
    pass


def _is_private_ip(addr: str) -> bool:
    try:
        ip = ipaddress.ip_address(addr)
    except ValueError:
        return False
    return (
        ip.is_private
        or ip.is_loopback
        or ip.is_link_local
        or ip.is_reserved
        or ip.is_multicast
    )


def _allowed_school_domains() -> list[str]:
    return [
        domain.strip().lower().lstrip(".").rstrip(".")
        for domain in settings.school_allowed_domains.split(",")
        if domain.strip()
    ]


def _host_matches_allowed_domain(host: str, allowed_domain: str) -> bool:
    return host == allowed_domain or host.endswith(f".{allowed_domain}")


def _validate_school_domain(host: str) -> None:
    if not settings.school_mode:
        return

    allowed = _allowed_school_domains()
    if not allowed:
        raise URLValidationError("School mode is enabled, but no approved domains are configured.")

    if not any(_host_matches_allowed_domain(host, domain) for domain in allowed):
        raise URLValidationError("This URL's domain is not approved for school mode.")


def validate_fetch_url(url: str) -> str:
    """Return a normalized URL or raise URLValidationError."""
    if not url or not isinstance(url, str):
        raise URLValidationError("No URL provided.")

    parsed = urlparse(url.strip())
    if parsed.scheme not in ("http", "https"):
        raise URLValidationError("Only http and https URLs are allowed.")

    host = (parsed.hostname or "").lower().rstrip(".")
    if not host:
        raise URLValidationError("URL is missing a hostname.")

    _validate_school_domain(host)

    if host in _BLOCKED_HOSTS or host.endswith(".localhost"):
        raise URLValidationError("Local and loopback URLs are not allowed.")

    # Block obvious private-network literals in the hostname.
    if _is_private_ip(host):
        raise URLValidationError("Private network URLs are not allowed.")

    # Resolve DNS and reject private IPs (blocks SSRF via redirects to metadata).
    try:
        for info in socket.getaddrinfo(host, None):
            resolved = info[4][0]
            if _is_private_ip(resolved):
                raise URLValidationError("URL resolves to a private network address.")
    except socket.gaierror:
        raise URLValidationError(f"Could not resolve hostname: {host}")

    return url.strip()
