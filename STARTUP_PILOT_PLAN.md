# School Accessibility Pilot Plan

Ditto's strongest startup wedge is a small, measurable pilot for school accessibility teams. This plan keeps the product focused: help students read required web content in the format that works for them, while giving coordinators enough proof to justify adoption.

## Target buyer

- Disability/accessibility services at high schools, colleges, and universities.
- Learning-support teams serving students with dyslexia, ADHD, low vision, screen-reader needs, cognitive overload, or hearing-access needs.
- Pilot champion: accessibility coordinator, assistive technology specialist, or student-success lead.

## Target user

A student who receives links to articles, course pages, public resources, or web-based readings and needs the content converted into a calmer, clearer, more accessible version.

## Pilot promise

"Give us a reading list and 5 to 10 students. Ditto will turn those web pages into personalized accessible versions and report whether reading accessibility improved."

## MVP pilot workflow

1. Coordinator creates or selects student reading profiles.
2. Coordinator uploads or pastes a small set of approved reading URLs.
3. Ditto transforms each URL into profile-specific accessible HTML.
4. Student opens the rebuilt page from a private link or browser extension.
5. Ditto records only minimal metadata: URL, profile category, transform status, score movement, and timestamp.
6. Coordinator exports a simple before/after accessibility report.

## Evidence needed before fundraising

- 5 to 10 student interviews.
- 2 to 3 accessibility coordinator interviews.
- At least one pilot reading list with 20 to 50 transformed pages.
- Before/after accessibility measurements using LLM score plus axe-core checks.
- Qualitative student feedback on clarity, effort, confidence, and preference fit.
- Reliability metrics: transform success rate, average processing time, cache hit rate.

## Product requirements for a pilot-ready version

### Must-have

- Authenticated student/coordinator accounts.
- Private transform links, not public-by-default sharing.
- Async transform jobs with status tracking.
- Persistent cache for assigned readings.
- URL safety hardening and domain controls.
- Exportable CSV/PDF accessibility report.
- Clear privacy copy for students and schools.

### Should-have

- Admin dashboard for reading lists and student profiles.
- Per-school quota and usage limits.
- axe-core HTML validation in addition to LLM scoring.
- Manual override when a page cannot be transformed safely.
- Extension install guide for managed school devices.

### Not yet

- Payments before pilots.
- Full LMS integration.
- Public marketplace.
- Automatic transformation of logged-in/private course pages.
- Medical/legal accessibility claims beyond measured pilot results.

### Implemented scaffold

- `POST /pilot/reading-list` validates an approved reading list without spending scrape or LLM budget.
- `GET /pilot/reading-list/{pilot_id}` retrieves the in-process pilot record for local/demo review.
- Each reading item reports `ready` or `blocked`, the approved domain, profile categories, and future before/after score fields.
- The scaffold honors existing URL safety and school-domain controls. It is intentionally in-memory until auth, persistence, and reviewer workflows are designed.

## Risks to handle early

- **Privacy:** minimize profile data and avoid storing full browsing history by default.
- **Copyright/ToS:** frame transformed pages as personal accessibility views, avoid public redistribution for pilot content.
- **Reliability:** arbitrary web pages will fail, so provide clear failures and fallback summaries.
- **Cost:** use quotas, persistent cache, and batch transforms before scaling pilots.
- **Accessibility trust:** do not rely only on LLM self-scoring. Add deterministic checks and human feedback.

## Investor narrative

Ditto starts as a personal accessibility browser, then narrows into a school-focused assistive reading layer. The wedge is measurable student support: students get reading content adapted to their profile, while schools get a privacy-conscious way to improve access and document outcomes.

## Pilot success metrics

- 80%+ of approved reading URLs transform successfully.
- 50%+ reduction in deterministic accessibility issues on transformed pages.
- 70%+ of student testers prefer the Ditto version for dense readings.
- Median transform completes within 60 seconds for uncached pages.
- Repeat reading-list transforms hit cache across users/profiles where possible.
