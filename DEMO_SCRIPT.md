# Ditto Demo Script

Use this as a tight 75 to 90 second portfolio or LinkedIn demo. The goal is to prove Ditto is a shipped product system, not a prompt wrapper.

## Setup before recording

- Run the frontend and backend locally, or use the deployed URLs if available.
- Pick one safe, public article or school reading page.
- Choose one persona before recording, such as dyslexia support plus larger text and plain language.
- Keep browser zoom at 100 percent so typography changes are clearly visible.
- If provider keys are unavailable, record the UI path and narrate the expected transform step without making live API calls.

## 90 second narration

### 0:00 to 0:10 — Hook

"This is Ditto, an AI accessibility browser. Instead of only auditing a webpage, it rebuilds the page around how a specific person reads."

Show the landing page and the proof strip.

### 0:10 to 0:25 — Personalization

"I start by choosing reading needs: dyslexia-friendly typography, larger text, calmer layout, high contrast, captions or transcript support, and plain language. Ditto keeps these preferences local-first unless the user opts into history."

Show onboarding or preferences.

### 0:25 to 0:45 — Transform flow

"Now I paste a URL. The backend validates the URL, scrapes the page with Playwright, classifies the content, and asks the model to return accessible HTML for this profile."

Show chat URL input and loading state.

### 0:45 to 1:05 — Output evidence

"The result is not just rewritten text. Ditto shows a sandboxed rebuilt page, clearer structure, calmer typography, and before/after accessibility evidence."

Highlight headings, readable spacing, score panel, and sandboxed preview.

### 1:05 to 1:20 — Distribution surface

"I also built a Chrome MV3 extension so the same workflow can start from the active tab, not only from the web app."

Show the extension popup if available.

### 1:20 to 1:30 — Startup wedge

"The strongest next wedge is schools: approved reading domains, staff-reviewed materials, per-student accessible versions, cached class assignments, and exportable accessibility reports."

End on the case study or roadmap.

## B-roll checklist

- Landing page hero.
- Preference selection.
- Chat URL input.
- Rebuilt output.
- Before/after score panel.
- Share link or history surface.
- Extension popup.
- `SCALABILITY_ROADMAP.md` or `SCHOOL_ACCESSIBILITY_READINESS.md` for the next milestone.
