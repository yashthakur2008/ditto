# Ditto Portfolio Case Study

## One-line pitch

Ditto is an AI accessibility layer that rebuilds any webpage around the way a person reads.

## Why it matters

Most accessibility tools either audit pages or change surface-level styling. Ditto goes further: it takes a real page, removes clutter, rewrites structure and language for a user's needs, and returns a readable, sandboxed rebuilt version with before/after accessibility scores.

## What I built

- **Full-stack product:** Next.js app, FastAPI backend, Chrome Manifest V3 extension, and deploy configs.
- **AI pipeline:** Playwright/browser scrape -> content safety classification -> OpenAI HTML rebuild -> before/after scoring.
- **Personalization:** Profiles for blind, low vision, dyslexia, deaf/hard-of-hearing, ADHD, tremor, elderly, children, and plain-language readers.
- **Distribution surface:** Web app for onboarding/chat/output, plus one-click browser extension flow.
- **Startup thinking:** Public scalability roadmap with concrete infrastructure, security, and go-to-market milestones.

## Demo path for LinkedIn

Use this flow for a 60 to 90 second screen recording:

1. Open Ditto landing page and say: "This is Ditto, an AI accessibility browser for people who read differently."
2. Click **Get started**.
3. Fill preferences as a specific user persona, for example: "high contrast, larger text, plain language, dyslexia support."
4. Paste a safe article/product page URL in chat.
5. Show the rebuilt page in the output view.
6. Point out before/after scoring, simplified language, calmer layout, and screen-reader-friendly structure.
7. Open the Chrome extension popup and show the same concept working from the active tab.
8. End on the roadmap: "The MVP works. Next is startup-grade queues, quotas, persistent cache, auth, and accessibility validation."

## What makes it technically credible

- **Real web scraping:** Playwright handles JS-heavy pages, with an httpx/BeautifulSoup fallback.
- **Safety boundaries:** URL validation blocks local/private targets, transformed pages render in sandboxed frames, and history/share behavior is opt-in.
- **Provider separation:** OpenAI handles transform/chat/scoring, Claude handles agent action planning, and ElevenLabs handles optional TTS.
- **Testing discipline:** Backend tests cover validation, sharing, profiles, cache behavior, transform validation, and health checks. Frontend has typecheck/build/lint workflows.
- **Scalability plan:** The repo includes `SCALABILITY_ROADMAP.md` with the path from MVP to fundable system.

## Best LinkedIn post angle

> I built Ditto, an AI accessibility layer that rebuilds websites around how someone reads.
>
> Instead of only auditing a page, Ditto asks for your reading needs, scrapes a live URL, rebuilds the page into accessible HTML, scores before/after accessibility, and lets you view the result in a sandboxed preview or Chrome extension.
>
> Stack: Next.js, FastAPI, Playwright, OpenAI, Claude, Firebase, ElevenLabs, Chrome MV3.
>
> The hardest part was balancing personalization, arbitrary web scraping, cost, safety, and accessibility quality. The MVP works, and the roadmap now points toward a school-accessibility startup: async jobs, quotas, persistent cache, auth, observability, and real WCAG validation.

## Portfolio proof checklist

- [ ] Record 60 to 90 second demo video.
- [ ] Add two screenshots or GIFs to the README.
- [ ] Deploy frontend and backend to public URLs.
- [ ] Pin the GitHub repo on LinkedIn/GitHub profile.
- [ ] Add a short architecture diagram screenshot to the post.
- [ ] Include one measurable claim from a demo run, such as before/after score movement or page simplification result.

## Startup wedge

Best first wedge: **schools and student accessibility teams**.

Why:

- Clear accessibility pain for students with dyslexia, ADHD, low vision, screen-reader needs, and cognitive overload.
- Institutions already have accessibility obligations.
- The product can start as a tool for learning content rather than the whole web.
- Outcomes are measurable: reading time, comprehension, task completion, WCAG issue reduction, and student satisfaction.

## Next fundable milestone

Build a pilot-ready version for one school accessibility office:

- Admin-safe mode with strict logging and privacy controls.
- Per-student reading profiles.
- Async transform jobs and quotas.
- Persistent transform cache for assigned readings.
- Exportable accessibility reports.
- 5 to 10 user interviews with students and accessibility coordinators.
