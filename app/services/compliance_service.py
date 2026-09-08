"""
Maps a country code to content-standard notes injected into the transform prompt.
Optionally resolves a country from a lat/lng via Google Maps reverse geocode.
"""
import googlemaps
from app.config import settings

_client: googlemaps.Client | None = None


def _maps() -> googlemaps.Client:
    global _client
    if _client is None:
        _client = googlemaps.Client(key=settings.google_maps_api_key)
    return _client


def country_from_latlng(lat: float, lng: float) -> str | None:
    """Returns ISO 3166-1 alpha-2 country code, e.g. 'US', 'GB', 'DE'."""
    try:
        results = _maps().reverse_geocode((lat, lng))
        for r in results:
            for comp in r.get("address_components", []):
                if "country" in comp.get("types", []):
                    return comp.get("short_name")
    except Exception:
        pass
    return None


# Maps country → plain-English compliance note for Gemini
_STANDARDS: dict[str, str] = {
    "US": (
        "Follow ADA / WCAG 2.1 AA. Apply COPPA restrictions for users under 13 "
        "(do not surface data-collection forms or behavioural advertising)."
    ),
    "GB": (
        "Follow UK Equality Act 2010 and the Online Safety Act. "
        "BBFC age ratings apply: block 18+ content for minors. "
        "Ensure WCAG 2.2 compliance."
    ),
    "AU": (
        "Follow the Disability Discrimination Act and eSafety Commissioner guidelines. "
        "ACB classification applies: block MA15+ content for users under 15."
    ),
    "CA": (
        "Bilingual support may be expected (English + French). "
        "Follow AODA and WCAG 2.0 AA. Apply PIPEDA for any data-collection elements."
    ),
    "DE": (
        "Follow BFSG (Barrierefreiheitsstärkungsgesetz) and EU EAA. "
        "JuSchG youth-protection rules apply: block content rated 18+ for minors. "
        "GDPR: remove tracking elements and cookie consent nags."
    ),
    "FR": (
        "Follow EU EAA and French RGAA accessibility standard. "
        "CSA content ratings apply. GDPR: strip cookies and trackers."
    ),
    "IN": (
        "Follow the Rights of Persons with Disabilities Act 2016. "
        "Content must comply with CBFC guidance for minors."
    ),
    "JP": (
        "Follow JIS X 8341-3 (accessibility standard). "
        "Eirin age ratings apply for video content."
    ),
    "BR": (
        "Follow LBI (Lei Brasileira de Inclusão) accessibility requirements. "
        "LGPD applies: remove third-party tracking elements."
    ),
}

_DEFAULT = (
    "Follow WCAG 2.1 AA as the international baseline. "
    "Remove third-party tracking and advertising. "
    "The user's location is used only to look up the applicable regional "
    "accessibility standard, not for any other purpose."
)


def get_compliance_note(country: str) -> str:
    return _STANDARDS.get(country.upper(), _DEFAULT)
