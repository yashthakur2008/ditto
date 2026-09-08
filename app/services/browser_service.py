"""
Local headless-browser scraping via Playwright.

Renders JS/SPA pages (React, Next.js, etc.) locally with Playwright,
but in-process — no external API key or vendor dependency.
"""
import asyncio
from playwright.async_api import async_playwright, Browser

_BLOCKED_RESOURCE_TYPES = {"image", "media", "font"}

_playwright_ctx = None
_browser: Browser | None = None
_lock = asyncio.Lock()


async def _get_browser() -> Browser:
    """Lazily launch a single shared browser instance and reuse it across requests."""
    global _playwright_ctx, _browser
    async with _lock:
        if _browser is None or not _browser.is_connected():
            _playwright_ctx = await async_playwright().start()
            _browser = await _playwright_ctx.chromium.launch(args=["--no-sandbox"])
    return _browser


async def scrape(url: str) -> str | None:
    """
    Load `url` in headless Chromium and return the rendered HTML.
    Returns None on any failure so the caller can fall back to BeautifulSoup.
    """
    try:
        browser = await _get_browser()
        page = await browser.new_page()
        try:
            await page.route(
                "**/*",
                lambda route: route.abort()
                if route.request.resource_type in _BLOCKED_RESOURCE_TYPES
                else route.continue_(),
            )

            # DOM ready is enough to extract content — don't fail the whole
            # scrape just because a page keeps polling/websocket-ing forever.
            await page.goto(url, wait_until="domcontentloaded", timeout=20_000)
            try:
                await page.wait_for_load_state("networkidle", timeout=5_000)
            except Exception:
                pass  # best-effort — page is likely still usable

            return await page.content()
        finally:
            await page.close()
    except Exception:
        return None
