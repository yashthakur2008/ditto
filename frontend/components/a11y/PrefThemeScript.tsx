/**
 * Pre-hydration script: reads stored preferences from localStorage and
 * applies data-* attributes + --text-scale to <html> BEFORE React hydrates.
 * Avoids a flash of unstyled (low-contrast / wrong-size) content for users
 * who have set strong accessibility preferences.
 */
const script = `
(function () {
  try {
    var raw = localStorage.getItem("ditto.flow.v1");
    if (!raw) return;
    var flow = JSON.parse(raw);
    var p = flow && flow.preferences;
    if (!p) return;
    var html = document.documentElement;
    var vision = Array.isArray(p.vision) ? p.vision : [];
    if (vision.indexOf("high-contrast") > -1) html.setAttribute("data-contrast", "high");
    if (vision.indexOf("reduced-motion") > -1) html.setAttribute("data-motion", "reduced");
    if (p.dyslexia && p.dyslexia !== "none") html.setAttribute("data-dyslexia", p.dyslexia);
    var scale = 1;
    if (vision.indexOf("larger-text") > -1) {
      var s = typeof p.textScale === "number" ? p.textScale : 1.2;
      if (s < 1) s = 1;
      if (s > 1.5) s = 1.5;
      scale = s;
    }
    html.style.setProperty("--text-scale", String(scale));
  } catch (e) { /* localStorage unavailable — fall through to defaults */ }
})();
`.trim();

export function PrefThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
