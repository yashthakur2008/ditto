"""
Two-step pipeline:
  Step 1 — a local headless browser (Playwright) scrapes the live page
            (handles JS-rendered SPAs). Falls back to httpx + BeautifulSoup
            for simple pages or when the browser render fails.
  Step 2 — OpenAI classifies content safety, then transforms the HTML into
            an accessible rebuild tailored to the user's disability profile.

Minor protection is tiered:
  safe     → transform normally
  mild     → rephrase/sanitize profanity and mild violence, keep structure
  hardcore → block entire content sections, show a safe placeholder,
             but still render the rest of the page so the user isn't locked out
"""
import hashlib
import json
import re
import ssl
import time
from collections import OrderedDict

import httpx
from bs4 import BeautifulSoup, Comment

from app.config import settings
from app.services import openai_service, browser_service, score_service
from app.models.schemas import TransformProfile
from app.services.url_validation import validate_fetch_url

_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0 Safari/537.36"
    )
}

_SCRUB_CLASSES = re.compile(
    r"ad[-_]|cookie|popup|banner|track|analytic|newsletter|overlay|modal",
    re.I,
)

# ── HTML scraping ──────────────────────────────────────────────────────────────

def _lenient_ssl() -> ssl.SSLContext:
    ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    ctx.set_ciphers("DEFAULT:@SECLEVEL=0")
    return ctx


def _clean_html(raw_html: str) -> str:
    """Strip scripts/nav/ads/hidden noise and return the main content region."""
    soup = BeautifulSoup(raw_html, "html.parser")

    for tag in soup(["script", "style", "noscript", "iframe",
                     "svg", "video", "audio", "canvas", "meta", "link"]):
        tag.decompose()

    for comment in soup.find_all(string=lambda t: isinstance(t, Comment)):
        comment.extract()

    for tag in soup.find_all(True):
        style = tag.get("style", "").replace(" ", "")
        if "display:none" in style or "visibility:hidden" in style:
            tag.decompose()

    for tag in soup.find_all(True):
        classes = " ".join(tag.get("class", []))
        if _SCRUB_CLASSES.search(classes):
            tag.decompose()

    candidates = [
        tag for tag in (
            soup.find("main"),
            soup.find("article"),
            soup.find(id="content"),
            soup.find(id="main"),
            soup.find("body"),
        )
        if tag is not None
    ]
    main = max(candidates, key=lambda t: len(t.get_text(strip=True)), default=soup)
    # LLM calls are billed by tokens in both directions — the rebuild prompt echoes
    # this content back in full, so trimming it directly cuts cost. 20k chars
    # (~5k tokens) comfortably covers a full article/page body.
    return str(main)[:20_000]


async def _fetch_via_beautifulsoup(url: str) -> str:
    """Fallback scraper for simple, server-rendered pages."""
    async with httpx.AsyncClient(verify=_lenient_ssl(), follow_redirects=True, timeout=15) as client:
        r = await client.get(url, headers=_HEADERS)
        r.raise_for_status()

    return _clean_html(r.text)


async def scrape(url: str) -> str:
    """
    Step 1 — try a local headless-browser render first (handles JS, React, Next.js pages).
    Falls back to BeautifulSoup for simple HTML.
    """
    safe_url = validate_fetch_url(url)

    rendered = await browser_service.scrape(safe_url)
    if rendered and len(rendered) > 200:
        return _clean_html(rendered)

    return await _fetch_via_beautifulsoup(safe_url)


# ── Content classification ─────────────────────────────────────────────────────

_CLASSIFY_PROMPT = """Analyse the following HTML content and classify its safety for a minor (under 18).

Respond with ONLY a JSON object in this exact format — no markdown, no explanation:
{{"level": "<safe|mild|hardcore>", "reason": "<one sentence>"}}

Definitions:
- safe: no adult content, appropriate for all ages
- mild: contains profanity, suggestive themes, mild violence, or alcohol/drug references
- hardcore: contains explicit sexual content, graphic violence, pornography, or extreme hate speech

Content to classify:
"""


async def classify_content(html: str) -> tuple[str, str]:
    """Returns (level, reason) using the light OpenAI model."""
    snippet = html[:8_000]
    try:
        raw = await openai_service.generate(_CLASSIFY_PROMPT + snippet, model=settings.openai_light_model)
        raw = raw.strip()
        if raw.startswith("```"):
            raw = raw.split("\n", 1)[1].rsplit("```", 1)[0]
        data = json.loads(raw)
        level = data.get("level", "safe")
        reason = data.get("reason", "")
        if level not in ("safe", "mild", "hardcore"):
            level = "safe"
        return level, reason
    except Exception:
        return "safe", ""


# ── Prompt building ────────────────────────────────────────────────────────────

def _complexity_label(level: int) -> str:
    return {1: "very simple (age 6)", 2: "simple (age 10)",
             3: "plain", 4: "standard", 5: "detailed"}.get(level, "plain")


def _build_transform_prompt(
    html: str,
    profile: TransformProfile,
    content_level: str,
    compliance_note: str | None,
) -> str:
    minor = profile.age < 18
    complexity = _complexity_label(profile.complexity)

    lines = [
        "You are an accessibility transformation engine.",
        "Rewrite the HTML below into a clean, fully accessible webpage.",
        "",
        "USER PROFILE:",
        f"  disability    : {profile.disability}",
        f"  age           : {profile.age}  (minor = {minor})",
        f"  country       : {profile.country}",
        f"  reading level : {complexity}",
        f"  simplify lang : {profile.simplify_language}",
        f"  content level : {content_level}",
        "",
        "RULES — apply ALL that match:",
        "1. Use semantic HTML5 (main, nav, h1–h3, p, button, a, section, article).",
        "2. Add descriptive ARIA labels to every interactive element.",
        "3. Remove ads, popups, cookie banners, and tracking noise. Keep all real content.",
        "4. Inject this base CSS in a <style> tag inside <head>:",
        "   body { font-family: Arial, sans-serif; max-width: 900px; margin: 0 auto;",
        "          padding: 20px; line-height: 1.8; }",
        "",
        "DISABILITY-SPECIFIC RULES:",
        "• dyslexia    → OpenDyslexic font; letter-spacing 0.1em; max 2 sentences per paragraph;",
        "                left-align; background #fffdf0.",
        "• blind       → detailed alt text on ALL images; skip-to-main link; ARIA landmarks.",
        "• low_vision  → font-size min 22px; black on white; high contrast; underlined links;",
        "                large touch targets; detailed image descriptions.",
        "• adhd        → bullet points and short paragraphs; bold first words; remove sidebars;",
        "                clear section dividers; font-size 17px.",
        "• tremor      → all click targets min 64×64px; generous spacing; large form fields;",
        "                no hover-only interactions; sticky large nav.",
        "• elderly     → font-size min 20px; high contrast; simple vocabulary; large buttons.",
        "• deaf        → mark audio/video; provide transcripts and visual descriptions.",
        "• none        → clean clutter, ensure comfortable readability.",
        "",
        "MINOR CONTENT RULES (apply only when minor = True):",
    ]

    if minor and content_level == "mild":
        lines += [
            "• content_level = mild: REPHRASE all profanity, suggestive text, and",
            "  mild violence — replace individual words with clean alternatives.",
            "  Do NOT remove the surrounding paragraph; just clean the wording.",
        ]
    elif minor and content_level == "hardcore":
        lines += [
            "• content_level = hardcore: The entire body text of this page contains",
            "  content that must not be shown to a minor.",
            "  Replace ALL body content with this exact block:",
            "  <main>",
            "    <div style='max-width:600px;margin:60px auto;padding:32px;",
            "         background:#fff8f8;border:2px solid #c00;border-radius:12px;",
            "         font-family:Arial,sans-serif;text-align:center;'>",
            "      <h1 style='color:#c00;font-size:2rem;'>Access Restricted</h1>",
            "      <p style='font-size:1.1rem;line-height:1.8;margin-top:16px;'>",
            "        This page contains content that isn't suitable for your age group.",
            "        Ditto has blocked it to keep you safe.",
            "      </p>",
            "      <p style='color:#555;margin-top:12px;'>",
            "        You can still visit other websites — just paste a new link.",
            "      </p>",
            "    </div>",
            "  </main>",
            "  Keep the <head>, <title>, and any navigation links intact.",
        ]

    if profile.simplify_language or profile.complexity <= 2:
        lines.append(f"• Rewrite all body text at a {complexity} reading level.")

    if compliance_note:
        lines += ["", f"COUNTRY COMPLIANCE ({profile.country}): {compliance_note}"]

    lines += [
        "",
        "Return ONLY a complete valid HTML document starting with <!DOCTYPE html>.",
        "No markdown fences, no explanation — HTML only.",
        "",
        "HTML TO TRANSFORM:",
        html,
    ]
    return "\n".join(lines)


# ── Scrape cache (per URL, profile-independent) ─────────────────────────────────
# Scraping (a headless-browser render) and scoring the ORIGINAL page cost the
# same regardless of which profile the page is being rebuilt for. Caching
# this step separately from the full result means re-rebuilding the same URL
# for a different profile — e.g. a user tweaking their preferences and
# re-running the same link — skips the browser render and one LLM call
# entirely, instead of only benefiting on an exact (url, profile) repeat.

_SCRAPE_CACHE_TTL_SECONDS = 10 * 60
_SCRAPE_CACHE_MAX_ENTRIES = 200
_scrape_cache: "OrderedDict[str, tuple[float, dict]]" = OrderedDict()


async def _get_scraped(url: str) -> dict:
    """
    Returns a shared, mutable record for this URL:
    {"html", "before_score", "content_level" (None until a minor's profile
    first needs it), "content_reason"}.
    """
    now = time.time()
    cached = _scrape_cache.get(url)
    if cached is not None:
        expires_at, record = cached
        if now <= expires_at:
            _scrape_cache.move_to_end(url)
            return record
        _scrape_cache.pop(url, None)

    html = await scrape(url)
    before_score = await score_service.score(html)
    record = {"html": html, "before_score": before_score, "content_level": None, "content_reason": ""}

    _scrape_cache[url] = (now + _SCRAPE_CACHE_TTL_SECONDS, record)
    _scrape_cache.move_to_end(url)
    while len(_scrape_cache) > _SCRAPE_CACHE_MAX_ENTRIES:
        _scrape_cache.popitem(last=False)
    return record


# ── Result cache (per URL + profile) ────────────────────────────────────────────
# Repeat visitors (or a batch re-run) hit the same URL+profile combination
# often; caching the full result in memory for a short TTL skips the
# pipeline entirely on an exact repeat. Per-process — fine for a single
# Cloud Run/Render instance, and simply reduces hit rate (not correctness)
# if there are multiple instances.

_CACHE_TTL_SECONDS = 15 * 60
_CACHE_MAX_ENTRIES = 200
_cache: "OrderedDict[str, tuple[float, tuple[str, str, dict, dict, str]]]" = OrderedDict()


def _cache_key(url: str, profile: TransformProfile, compliance_note: str | None) -> str:
    payload = json.dumps(
        {"url": url, "profile": profile.model_dump(), "compliance_note": compliance_note},
        sort_keys=True,
    )
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def _cache_get(key: str) -> tuple[str, str, dict, dict, str] | None:
    entry = _cache.get(key)
    if not entry:
        return None
    expires_at, value = entry
    if time.time() > expires_at:
        _cache.pop(key, None)
        return None
    _cache.move_to_end(key)
    return value


def _cache_set(key: str, value: tuple[str, str, dict, dict, str]) -> None:
    _cache[key] = (time.time() + _CACHE_TTL_SECONDS, value)
    _cache.move_to_end(key)
    while len(_cache) > _CACHE_MAX_ENTRIES:
        _cache.popitem(last=False)


# ── Public API ─────────────────────────────────────────────────────────────────

async def transform(
    url: str,
    profile: TransformProfile,
    compliance_note: str | None = None,
) -> tuple[str, str, dict, dict, str]:
    """
    Returns (transformed_html, content_level, before_score, after_score, original_html).
    Scores are dicts from score_service.score(). original_html is the cleaned
    (script/ad-stripped) source content, for side-by-side comparison.
    Results are cached in-memory for _CACHE_TTL_SECONDS per (url, profile);
    the scrape + original-page score are cached separately per URL so a
    different profile on the same URL skips those steps too.
    """
    key = _cache_key(url, profile, compliance_note)
    cached = _cache_get(key)
    if cached is not None:
        return cached

    # Step 1 — scrape (or reuse) the live page, and score the original
    record = await _get_scraped(url)
    html = record["html"]
    before_score = record["before_score"]

    # Step 2a — classify content only when a minor's profile first needs it;
    # the result is cached on the URL record for future minor requests too.
    if profile.age < 18:
        if record["content_level"] is None:
            record["content_level"], record["content_reason"] = await classify_content(html)
        content_level = record["content_level"]
    else:
        content_level = "safe"

    # Step 2b — OpenAI transforms the page
    prompt = _build_transform_prompt(html, profile, content_level, compliance_note)
    result = await openai_service.generate(prompt)
    result = result.strip()
    if result.startswith("```"):
        result = result.split("\n", 1)[1].rsplit("```", 1)[0]

    # Step 3 — score the rebuilt page
    after_score = await score_service.score(result)

    value = (result, content_level, before_score, after_score, html)
    _cache_set(key, value)
    return value
