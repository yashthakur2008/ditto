"""Gemini-powered conversational replies for the Ditto chat UI."""
from app.services import gemini_service

_CHAT_SYSTEM = """You are Ditto, a warm and clever AI accessibility companion built to help people
access the web on their own terms. You rebuild websites to match each person's unique needs —
whether they're blind, deaf, have dyslexia, ADHD, tremors, low vision, or are elderly.

Personality: friendly, concise, never condescending. You speak in short sentences.
You don't just answer — you show you understand the user's situation.

When a user shares a URL, tell them you're rebuilding it.
When they share accessibility challenges, empathize briefly then pivot to action.
When they ask general questions, answer helpfully and tie back to how Ditto can help.
Keep responses under 3 sentences unless the user asks for detail.
Never say "As an AI" or "I'm just a language model"."""


async def chat(messages: list[dict], preferences: dict) -> str:
    disability = preferences.get("disability", "none")
    name = preferences.get("name", "")
    age = preferences.get("age", "")

    context = _CHAT_SYSTEM
    if disability and disability != "none":
        context += f"\nUser has {disability} accessibility needs."
    if name:
        context += f"\nUser's name is {name}."
    if age:
        context += f"\nUser is {age} years old."

    convo = context + "\n\n---\n"
    for m in messages[-12:]:
        role = "User" if m.get("role") == "user" else "Ditto"
        convo += f"{role}: {m.get('text', '')}\n"
    convo += "Ditto:"

    return await gemini_service.generate(
        convo,
        generation_config={"max_output_tokens": 200, "temperature": 0.7},
    )
