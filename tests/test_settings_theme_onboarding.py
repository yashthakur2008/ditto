from pathlib import Path

SETTINGS_PAGE = Path("frontend/app/settings/page.tsx")
TYPES_FILE = Path("frontend/lib/types.ts")
APPLY_PREFS = Path("frontend/lib/applyPrefs.ts")
PREF_SCRIPT = Path("frontend/components/a11y/PrefThemeScript.tsx")
GLOBALS = Path("frontend/app/globals.css")
PREFERENCES_PAGE = Path("frontend/app/preferences/page.tsx")
CHAT_PAGE = Path("frontend/app/chat/page.tsx")


def test_preferences_include_theme_mode_defaulting_to_auto():
    source = TYPES_FILE.read_text()
    assert 'export type ThemeMode = "light" | "dark" | "auto"' in source
    assert "themeMode: ThemeMode" in source
    assert 'themeMode: "auto"' in source


def test_settings_exposes_local_api_key_controls_with_privacy_copy():
    source = SETTINGS_PAGE.read_text()
    assert "API keys" in source
    assert "OpenAI API key" in source
    assert "Claude API key" in source
    assert "ElevenLabs API key" in source
    assert "Saved only on this device" in source
    assert "ditto.api-keys.v1" in source
    assert 'type="password"' in source


def test_settings_exposes_light_dark_auto_appearance_controls():
    source = SETTINGS_PAGE.read_text()
    assert "Appearance" in source
    assert "Light" in source
    assert "Dark" in source
    assert "Auto" in source
    assert "themeMode" in source


def test_theme_mode_applies_before_and_after_hydration():
    apply_source = APPLY_PREFS.read_text()
    script_source = PREF_SCRIPT.read_text()
    assert "data-theme" in apply_source
    assert "prefers-color-scheme: dark" in apply_source
    assert "data-theme" in script_source
    assert "prefers-color-scheme: dark" in script_source


def test_first_time_preferences_page_is_onboarding_with_appearance_step():
    source = PREFERENCES_PAGE.read_text()
    assert "first time on this device" in source.lower()
    assert "Appearance" in source
    assert "themeMode" in source
    assert "Light" in source and "Dark" in source and "Auto" in source


def test_dynamic_animations_are_accessible_and_used_on_main_flows():
    css = GLOBALS.read_text()
    chat = CHAT_PAGE.read_text()
    preferences = PREFERENCES_PAGE.read_text()
    assert "@keyframes ditto-fade-up" in css
    assert "@keyframes ditto-pulse" in css
    assert ".motion-card" in css
    assert ".typing-pulse" in css
    assert "motion-card" in chat
    assert "motion-card" in preferences
    assert "typing-pulse" in chat


WELCOME_PAGE = Path("frontend/app/welcome/page.tsx")
STEP_GUARD = Path("frontend/components/flow/StepGuard.tsx")


def test_onboarding_completion_is_tracked_separately_from_typed_name():
    types_source = TYPES_FILE.read_text()
    guard_source = STEP_GUARD.read_text()
    welcome_source = WELCOME_PAGE.read_text()
    prefs_source = PREFERENCES_PAGE.read_text()
    assert "onboardingComplete" in types_source
    assert "onboardingComplete" in guard_source
    assert "state.onboardingComplete" in welcome_source
    assert "onboardingComplete" in prefs_source


def test_typing_indicator_has_minimum_visible_duration():
    source = CHAT_PAGE.read_text()
    assert "MIN_TYPING_MS" in source
    assert "withMinimumTypingTime" in source


def test_dark_theme_overrides_hardcoded_white_surfaces():
    css = GLOBALS.read_text()
    assert '[data-theme="dark"] .bg-white' in css
    assert '[data-theme="dark"] [class*="bg-white/"]' in css
