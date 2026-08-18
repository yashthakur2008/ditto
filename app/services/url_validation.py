"""
Validate user-supplied URLs before fetching them server-side (SSRF protection).
"""
import ipaddress
import socket
from urllib.parse import urlparse

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
