"""Tests for openai_service's per-model cache."""
from app.config import settings
from app.services import openai_service


def test_get_model_defaults_to_configured_model():
    assert openai_service._get_model(None) == settings.openai_model


def test_get_model_reuses_instance_for_same_name():
    m1 = openai_service._get_model("gpt-4o-mini")
    m2 = openai_service._get_model("gpt-4o-mini")
    assert m1 is m2


def test_get_model_creates_distinct_instances_per_name():
    default_model = openai_service._get_model(None)
    other_model = openai_service._get_model("gpt-4.1-mini")
    assert default_model != other_model
