# Tomorrow Demo Readiness

Use this as the final runbook before showing Ditto on LinkedIn, in an interview, or to a founder/investor.

## Goal for tomorrow

Make the viewer understand this in under 30 seconds:

> Ditto is a full-stack AI accessibility browser that turns a normal webpage into a personalized, safer, easier-to-read version, then shows evidence of the improvement.

## Best demo path

1. **Open the landing page.**
   - Say: "Ditto rebuilds the web around how someone reads."
   - Point to the portfolio snapshot and supported profiles.

2. **Show preferences.**
   - Pick a simple persona: dyslexia support, larger text, high contrast, plain language.
   - Say: "Preferences are local-first, and history is opt-in."

3. **Paste a safe public URL in chat.**
   - Use a public article, school reading page, documentation page, or product page.
   - Avoid logged-in pages, news paywalls, adult content, private docs, and pages with sensitive data.

4. **Show the rebuilt output.**
   - Highlight clearer headings, calmer typography, simpler language, larger touch targets, and sandboxed preview.
   - If live provider keys are unavailable, use the UI path and explain the expected transform without triggering paid calls.

5. **Show credibility artifacts.**
   - `PORTFOLIO_CASE_STUDY.md` for story.
   - `DEMO_SCRIPT.md` for narration.
   - `SCHOOL_ACCESSIBILITY_OPERATING_PLAN.md` for startup wedge.
   - `HOSTING_OPTIONS.md` for deployment realism.

6. **Close with the wedge.**
   - Say: "The portfolio project is the AI accessibility browser. The startup wedge is school accessibility teams turning assigned readings into reviewed, student-specific accessible versions."

## 10-minute preflight

- [ ] `git status --short` is clean or intentionally understood.
- [ ] Backend starts locally: `uvicorn app.main:app --reload --port 8080`.
- [ ] Frontend starts locally: `cd frontend && npm run dev`.
- [ ] `/health` returns `status: ok`.
- [ ] Browser extension is either loaded or intentionally skipped.
- [ ] Demo page has no private data, credentials, or unpublished school/customer names.
- [ ] Provider keys and cost limits are understood before any live transform.
- [ ] Screen recording window hides terminal secrets and browser profiles if needed.

## If something breaks live

Use this fallback line:

> "The important part is the product loop: validated URL input, Playwright scrape, profile-aware HTML rebuild, before/after accessibility evidence, and a school pilot path. I have the repo artifacts and tests ready to show even if the live backend is cold or provider keys are off."

Then show:

1. `PORTFOLIO_CASE_STUDY.md`.
2. `DEMO_SCRIPT.md`.
3. README architecture diagram.
4. `SCHOOL_ACCESSIBILITY_OPERATING_PLAN.md` metrics table.
5. Test/build evidence from the commit history.

## Tomorrow success criteria

- A recruiter/founder understands the product in 30 seconds.
- The demo shows at least one complete user path or a credible fallback.
- The GitHub repo looks intentional, not hackathon-scrappy.
- The startup path is specific: school accessibility teams, approved readings, private links, reports, privacy controls, and measurable outcomes.
