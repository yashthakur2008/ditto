# Demo-safe URLs and Recording Checklist

Use this to avoid embarrassing or risky demo inputs.

## Good demo URL types

- Public school reading pages.
- Public documentation pages.
- Public nonprofit/government information pages.
- Public product pages with dense marketing copy.
- Public articles without paywalls or sensitive comments.

## Avoid

- Logged-in dashboards or private course pages.
- Bank, medical, legal, or government account pages.
- Adult, violent, hateful, or politically inflammatory pages.
- Paywalled news pages that may fail scraping or raise copyright concerns.
- Pages showing personal browser history, email, location, tokens, or cookies.

## Safe demo candidates to test manually

Before recording, pick 2 to 3 and verify they load cleanly:

- A public Wikipedia article with dense structure.
- A public university accessibility resource page.
- A public government service explainer page.
- A public product page with jargon-heavy copy.
- A public documentation page with nested headings.

## No-secrets recording checklist

- [ ] `.env`, `.env.local`, terminal env output, and browser password managers are hidden.
- [ ] API provider dashboards are closed.
- [ ] Browser profile does not show private bookmarks or emails.
- [ ] URL bar does not contain secret query params.
- [ ] DevTools network tab is closed unless intentionally showing non-secret requests.
- [ ] Any generated share link is treated as public.
- [ ] If recording live transforms, provider quota/cost limits are checked first.

## Preferred fallback if live transform is unavailable

Record the user journey up to the loading state, then cut to docs:

1. README architecture diagram.
2. `PORTFOLIO_CASE_STUDY.md` technical credibility section.
3. `SCHOOL_ACCESSIBILITY_OPERATING_PLAN.md` metrics plan.
4. `HOSTING_OPTIONS.md` deployment recommendation.

This still tells the portfolio story without leaking secrets or spending unexpected provider credits.
