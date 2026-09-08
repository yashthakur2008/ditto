"""OpenAI-backed text generation for Ditto."""
import httpx

from app.config import settings

_BASE_URL = "https://api.openai.com/v1"
_models: dict[str, str] = {}


def _get_model(name: str | None) -> str:
    name = name or settings.openai_model
    if name not in _models:
        _models[name] = name
    return _models[name]


async def generate(
    prompt: str,
    system_prompt: str | None = None,
    generation_config: dict | None = None,
    model: str | None = None,
) -> str:
    if not settings.openai_api_key:
        raise RuntimeError("OPENAI_API_KEY is not configured")

    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": prompt})

    payload: dict = {
        "model": _get_model(model),
        "messages": messages,
    }
    if generation_config:
        if "temperature" in generation_config:
            payload["temperature"] = generation_config["temperature"]
        if "max_output_tokens" in generation_config:
            payload["max_tokens"] = generation_config["max_output_tokens"]
        if "max_tokens" in generation_config:
            payload["max_tokens"] = generation_config["max_tokens"]

    async with httpx.AsyncClient(timeout=90) as client:
        response = await client.post(
            f"{_BASE_URL}/chat/completions",
            headers={
                "Authorization": f"Bearer {settings.openai_api_key}",
                "Content-Type": "application/json",
            },
            json=payload,
        )
        response.raise_for_status()
        data = response.json()

    return data["choices"][0]["message"]["content"]


async def generate_with_image(prompt: str, image_bytes: bytes, mime_type: str = "image/jpeg") -> str:
    if not settings.openai_api_key:
        raise RuntimeError("OPENAI_API_KEY is not configured")

    import base64

    image_url = f"data:{mime_type};base64,{base64.b64encode(image_bytes).decode('ascii')}"
    payload = {
        "model": settings.openai_vision_model,
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {"type": "image_url", "image_url": {"url": image_url}},
                ],
            }
        ],
    }
    async with httpx.AsyncClient(timeout=90) as client:
        response = await client.post(
            f"{_BASE_URL}/chat/completions",
            headers={
                "Authorization": f"Bearer {settings.openai_api_key}",
                "Content-Type": "application/json",
            },
            json=payload,
        )
        response.raise_for_status()
        data = response.json()
    return data["choices"][0]["message"]["content"]
