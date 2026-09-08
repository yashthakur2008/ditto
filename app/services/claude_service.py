"""Claude-backed browser action planning for Ditto."""
import httpx

from app.config import settings
from app.models.schemas import TransformProfile

_BASE_URL = "https://api.anthropic.com/v1"


async def execute(url: str, instruction: str, profile: TransformProfile) -> dict:
    """Plan an accessible browser action for the user with Claude."""
    if not settings.claude_api_key:
        raise RuntimeError("CLAUDE_API_KEY or ANTHROPIC_API_KEY is not configured")

    prompt = (
        "You are Ditto's accessibility action agent. Return concise JSON with "
        "keys: summary, steps, cautions. Do not perform unsafe actions.\n\n"
        f"URL: {url}\n"
        f"User profile: {profile.model_dump()}\n"
        f"Requested task: {instruction}"
    )
    async with httpx.AsyncClient(timeout=60) as client:
        response = await client.post(
            f"{_BASE_URL}/messages",
            headers={
                "x-api-key": settings.claude_api_key,
                "anthropic-version": "2023-06-01",
                "Content-Type": "application/json",
            },
            json={
                "model": settings.claude_model,
                "max_tokens": 800,
                "messages": [{"role": "user", "content": prompt}],
            },
        )
        response.raise_for_status()
        data = response.json()

    text = "".join(
        part.get("text", "")
        for part in data.get("content", [])
        if part.get("type") == "text"
    )
    return {"provider": "claude", "model": settings.claude_model, "text": text, "raw": data}
