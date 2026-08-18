import type { Preferences } from "./types";

const MIN_SCALE = 1.0;
const MAX_SCALE = 1.5;
const DEFAULT_SCALE_ON_TOGGLE = 1.2;

/**
 * Compute the effective root font-size multiplier from preferences.
 * - When "larger-text" is unchecked, scale is 1.0 (no growth)
 * - When checked, scale is the user's textScale, clamped to [1.0, 1.5]
 *
 * NOTE: do NOT bump 1.0 → 1.2 here. The slider's minimum IS 1.0, and
 * an asymmetric bump creates a visible jump as the user drags down past
 * 1.05 → 1.0. The default-on-first-toggle (1.2) is seeded via
 * `defaultPreferences.textScale`, not here.
 */
export function effectiveTextScale(prefs: Preferences | null): number {
  if (!prefs?.vision.includes("larger-text")) return 1.0;
  const raw = prefs.textScale ?? DEFAULT_SCALE_ON_TOGGLE;
  if (raw < MIN_SCALE) return MIN_SCALE;
  if (raw > MAX_SCALE) return MAX_SCALE;
  return raw;
}

/**
 * Mirrors the pre-hydration script in components/a11y/PrefThemeScript.tsx.
 * Applies the user's preferences to <html> data-* attributes and the
 * --text-scale CSS variable so globals.css can retheme the entire app.
 */
export function applyPreferencesToDocument(prefs: Preferences | null): void {
  if (typeof document === "undefined") return;
  const html = document.documentElement;
  const vision = prefs?.vision ?? [];
  const set = (attr: string, value: string | null) => {
    if (value) html.setAttribute(attr, value);
    else html.removeAttribute(attr);
  };
  set("data-contrast", vision.includes("high-contrast") ? "high" : null);
  set("data-motion", vision.includes("reduced-motion") ? "reduced" : null);
  set(
    "data-dyslexia",
    prefs?.dyslexia && prefs.dyslexia !== "none" ? prefs.dyslexia : null,
  );
  // Root font-size scale — affects every rem-based size in the app, so
  // headings, body, and spacing grow at the same rate.
  html.style.setProperty("--text-scale", String(effectiveTextScale(prefs)));
}
