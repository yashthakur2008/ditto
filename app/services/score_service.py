"""
Accessibility scoring via OpenAI.
Scores an HTML page 0-100 across five WCAG-aligned axes.
Fast and cheap — uses the light model and only the first 6 000 chars.
"""
import json
from app.config import settings
from app.services import openai_service

_PROMPT = """You are a WCAG 2.1 accessibility auditor.

Score the following HTML page out of 100 points across these five axes (20 pts each):

1. Images & Media   — do all images have meaningful alt text? Are videos captioned?
2. Semantic Structure — are proper heading levels, landmarks, and list elements used?
3. Readability       — is the font size, line height, and contrast readable?
4. Interactive Elements — do buttons/links/forms have labels, focus states, ARIA?
5. Content Clarity   — is language plain, jargon-free, and logically ordered?

For each axis give an integer score 0-20.

Respond with ONLY a JSON object in this exact format — no markdown, no explanation:
{
  "total": <0-100>,
  "images":       {"score": <0-20>, "note": "<one sentence>"},
  "structure":    {"score": <0-20>, "note": "<one sentence>"},
  "readability":  {"score": <0-20>, "note": "<one sentence>"},
  "interactive":  {"score": <0-20>, "note": "<one sentence>"},
  "clarity":      {"score": <0-20>, "note": "<one sentence>"}
}

HTML to audit:
"""


async def score(html: str) -> dict:
    # Scoring is a small structured-output task — the light model is plenty
    # accurate here and is meaningfully cheaper per call than the main model.
    snippet = html[:6_000]
    try:
        raw = await openai_service.generate(_PROMPT + snippet, model=settings.openai_light_model)
        raw = raw.strip()
        if raw.startswith("```"):
            raw = raw.split("\n", 1)[1].rsplit("```", 1)[0]
        data = json.loads(raw)
        # Clamp and validate
        for axis in ("images", "structure", "readability", "interactive", "clarity"):
            if axis not in data:
                data[axis] = {"score": 10, "note": "Could not evaluate."}
            data[axis]["score"] = max(0, min(20, int(data[axis]["score"])))
        data["total"] = sum(data[ax]["score"] for ax in
                            ("images", "structure", "readability", "interactive", "clarity"))
        return data
    except Exception:
        return {
            "total": 50,
            "images":      {"score": 10, "note": "Could not evaluate."},
            "structure":   {"score": 10, "note": "Could not evaluate."},
            "readability": {"score": 10, "note": "Could not evaluate."},
            "interactive": {"score": 10, "note": "Could not evaluate."},
            "clarity":     {"score": 10, "note": "Could not evaluate."},
        }
