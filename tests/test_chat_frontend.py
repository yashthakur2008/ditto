from pathlib import Path

CHAT_PAGE = Path("frontend/app/chat/page.tsx")


def test_chat_shows_ditto_typing_indicator_copy():
    source = CHAT_PAGE.read_text()
    assert 'ThinkingBubble label="Ditto is typing…"' in source
    assert 'Ditto is typing a response.' in source


def test_chat_has_backendless_assistant_fallback_response():
    source = CHAT_PAGE.read_text()
    assert "chatFallbackReply" in source
    assert "I can still help once the backend is connected" in source
    assert "catch" in source
