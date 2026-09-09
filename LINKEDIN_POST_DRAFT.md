# LinkedIn Post Draft: Ditto

I built **Ditto**, an AI accessibility browser that rebuilds websites around how someone reads.

Most accessibility tools stop at audits or visual overlays. Ditto tries a fuller product loop:

1. Ask for the user's reading and accessibility needs.
2. Validate and scrape a live URL.
3. Classify the content for safety and fit.
4. Rebuild the page into accessible HTML.
5. Show before/after accessibility evidence.
6. Let the user read, share, revisit, or start from a Chrome extension.

The stack:

- Next.js frontend with onboarding, preferences, chat, batch transforms, output, sharing, and settings.
- FastAPI backend with transform, score, chat, voice, share, profile/history, maps, and agent routes.
- Playwright for JS-heavy page scraping.
- OpenAI for transform/chat/scoring.
- Claude for agent action planning.
- Firebase for optional profile/history storage.
- ElevenLabs for optional text-to-speech.
- Chrome Manifest V3 extension for one-click active-tab rebuilds.

The interesting part was not just calling an LLM. It was designing the boundaries around arbitrary web input, personalization, privacy, cost control, sandboxed output, and credible accessibility evidence.

The next wedge I would take to market is schools: staff-approved reading materials, approved domains, per-student accessible versions, persistent cache for repeated assignments, quotas, and exportable reports for accessibility teams.

Demo script and case study are in the repo:

- `DEMO_SCRIPT.md`
- `PORTFOLIO_CASE_STUDY.md`
- `SCHOOL_ACCESSIBILITY_READINESS.md`
- `SCALABILITY_ROADMAP.md`

#Accessibility #AI #EdTech #WebDevelopment #NextJS #FastAPI #Portfolio

## Shorter variant

I built Ditto, an AI accessibility browser that rebuilds any webpage around how someone reads.

It asks for a user's accessibility profile, validates and scrapes a URL, rebuilds the page into accessible HTML, scores before/after accessibility, and supports both a web app and Chrome extension.

Stack: Next.js, FastAPI, Playwright, OpenAI, Claude, Firebase, ElevenLabs, Chrome MV3.

What makes it portfolio-worthy: it handles arbitrary web input, personalization, privacy, sandboxed output, cost-aware caching, and a credible school pilot wedge.
