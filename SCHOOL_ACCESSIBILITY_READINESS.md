# School Accessibility Readiness

Ditto's most fundable wedge is not a general-purpose browser. It is a pilot tool for school accessibility teams that need to make assigned digital readings usable for students with dyslexia, ADHD, low vision, screen-reader needs, cognitive overload, and emerging literacy needs.

## Pilot positioning

**Promise:** turn required reading links into student-specific accessible versions, with an audit trail that helps schools understand whether content became easier to navigate, read, and support.

**Buyer/user split:**

- **Buyer:** accessibility office, student support services, special education team, tutoring center, or district digital learning leader.
- **User:** students, accessibility coordinators, tutors, teachers, and families helping students complete digital assignments.
- **Initial use case:** assigned articles, course pages, library resources, and school-approved web content. Avoid the entire open web until controls mature.

## School-safe scope for the next build

### Must-have controls before a pilot

- **Approved-domain mode:** only transform school-approved domains or teacher-provided URLs.
- **Student privacy defaults:** no browsing history by default, no profile in public share links, minimal metadata retention, clear retention window.
- **Role separation:** student view for reading, staff view for assigning links and exporting accessibility reports.
- **Content safety:** keep existing classification, then add stricter minor-safe fallback behavior when content is ambiguous.
- **Accessibility evidence:** complement LLM scoring with axe-core checks, keyboard navigation tests, and manual screen-reader scripts.
- **Human override:** staff can review a rebuilt page before sharing it with a student or class.

### Nice-to-have controls

- Roster import only after legal/privacy review.
- District SSO only after a manual pilot proves demand.
- Billing only after quotas, usage logs, and data retention are stable.

## Pilot success metrics

Track outcomes that a school can understand without trusting AI marketing claims:

| Metric | Why it matters |
|---|---|
| Before/after WCAG issue count | Shows objective accessibility movement |
| Reading completion rate | Shows whether students finish assigned content |
| Time to first readable version | Measures workflow speed for staff and students |
| Student comprehension or confidence survey | Captures whether the rebuild helped learning |
| Staff prep time saved | Connects Ditto to budget and adoption |
| Cache hit rate for assigned readings | Shows cost control as classes reuse material |

## Data handling checklist

- Do not store raw student disability details unless the pilot has explicit consent and policy approval.
- Prefer local browser preferences for early pilots.
- Store transformed content by assigned reading and profile category, not by named student, where possible.
- Make share links unlisted and revocable before use with real schools.
- Keep an export/delete path for pilot data.
- Document which vendors process URLs, page content, and generated HTML.

## Pilot readiness stages

### Stage 0: Portfolio MVP, current repo

- Web app onboarding, preferences, chat, output, sharing, batch transforms.
- FastAPI backend with scraping, URL validation, transform, scoring, optional Firebase history, and extension flow.
- Good for demos, interviews, and technical proof.

### Stage 1: Controlled school pilot

- Approved-domain transforms.
- Staff-reviewed assigned readings.
- Persistent cache and audit-friendly reports.
- Accessibility validation with axe-core plus manual scripts.
- Basic quotas and rate limits.

### Stage 2: Procurement-ready product

- SSO, admin roles, retention controls, revocable sharing, incident logging, vendor documentation, and support playbooks.
- District-level usage dashboards.
- Signed privacy/security docs after counsel review.

## Next implementation tickets

1. Add `SCHOOL_ALLOWED_DOMAINS` config and reject non-approved domains when `SCHOOL_MODE=true`.
2. Add a staff-facing report object: source URL, transformed URL/share id, profile category, before/after score, axe issue summary, timestamp, reviewer.
3. Add keyboard and axe validation for the main app flow.
4. Add revocable share links before any real pilot.
5. Add persistent cache keyed by canonical URL, content hash, profile hash, model version, and prompt version.
