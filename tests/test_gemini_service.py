"""Tests for gemini_service's per-model instance caching."""
from app.services import gemini_service


def test_get_model_defaults_to_configured_model():
    from app.config import settings

    m = gemini_service._get_model(None)
    assert m.model_name.endswith(settings.gemini_model)


def test_get_model_reuses_instance_for_same_name():
    m1 = gemini_service._get_model("gemini-2.5-flash-lite")
    m2 = gemini_service._get_model("gemini-2.5-flash-lite")
    assert m1 is m2


def test_get_model_creates_distinct_instances_per_name():
    default_model = gemini_service._get_model(None)
    light_model = gemini_service._get_model("gemini-2.5-flash-lite")
    assert default_model is not light_model
