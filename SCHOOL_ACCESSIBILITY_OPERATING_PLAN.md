# School Accessibility Operating Plan

This document turns Ditto's school accessibility wedge into pilot-ready operating discipline. It complements [`SCHOOL_ACCESSIBILITY_READINESS.md`](SCHOOL_ACCESSIBILITY_READINESS.md), [`STARTUP_PILOT_PLAN.md`](STARTUP_PILOT_PLAN.md), and [`SCALABILITY_ROADMAP.md`](SCALABILITY_ROADMAP.md).

## Fundable wedge thesis

Schools already have legal, instructional, and student-success reasons to make assigned digital readings accessible. Ditto should start as a controlled assistive reading layer for approved school content, not as an unrestricted web transformation product.

**Narrow beachhead:** accessibility coordinators and learning-support teams who manually adapt digital readings for students and need faster preparation, measurable before/after evidence, and privacy-conscious workflows.

**Pilot outcome:** prove that Ditto can transform approved readings into more usable versions for defined accessibility profiles, with enough reliability and reporting for a school sponsor to continue or expand the pilot.

## School buyer narrative

### Pain

- Students receive dense web readings that are technically available but practically inaccessible.
- Staff spend time finding alternate formats, simplifying layouts, or coaching students through pages one by one.
- Schools need evidence that accessibility support improved access, not just an AI-generated page.
- Existing assistive technology often helps presentation but does not give coordinators a workflow for assigned links, review, and reporting.

### Ditto promise

"Give Ditto a school-approved reading list and selected accessibility profiles. Ditto returns private, student-friendly reading versions and a report showing what changed."

### Why now

- Schools are assigning more web-native course materials.
- Accessibility teams are under capacity pressure.
- LLM-assisted transformation can reduce manual preparation, but schools need guardrails, consent, deterministic checks, and human review before trusting it.

### Buyer proof points

- Faster staff preparation for reading accommodations.
- Higher student confidence and completion on assigned readings.
- Objective before/after accessibility signals from axe-core and keyboard checks.
- Clear data minimization and vendor-processing disclosure.
- Controlled domain allowlists and staff review before student sharing.

## Pilot plan

### Pilot shape

- **Duration:** 4 to 6 weeks.
- **School team:** 1 accessibility coordinator, 1 to 3 staff reviewers or tutors, 5 to 10 student testers.
- **Content set:** 20 to 50 approved reading URLs from courses, library pages, or school-approved public resources.
- **Profiles:** start with profile categories, not named disability records: dyslexia-friendly, ADHD/cognitive load, low vision, screen-reader-first, and simplified emerging literacy.
- **Deployment:** staff-mediated links or extension flow. Avoid LMS, roster import, or district SSO until after a manual pilot.

### Workflow

1. School sponsor approves the domain list and reading list.
2. Staff select one or more accessibility profile categories per reading.
3. Ditto transforms each approved URL and records minimal metadata.
4. Staff review the transformed page before sharing with students.
5. Students use private links for assigned readings.
6. Ditto captures operational metrics and optional short feedback.
7. Staff export a pilot report at the end of the cycle.

### Entry criteria

- Approved-domain mode is enabled and tested.
- Revocable private links or an equivalent controlled sharing path are available.
- Raw disability details are not required for the workflow.
- The school sponsor has reviewed data handling, vendor processing, and retention language.
- Staff have a manual fallback when a transform fails.

### Exit criteria

- At least 80% of approved readings transform successfully.
- Median uncached transform completes within 60 seconds.
- Transformed pages reduce deterministic accessibility issues on average.
- 70% or more of student testers prefer Ditto for at least one dense reading type.
- Staff can explain whether Ditto saved prep time or improved support quality.
- No unresolved privacy, safety, or content incidents remain open.

## Privacy and safety checklist

### Data minimization

- [ ] Store profile category preferences instead of named disability details whenever possible.
- [ ] Keep browsing history off by default for student users.
- [ ] Store only URL, canonical URL, content hash, profile category, transform status, score movement, reviewer, and timestamp for reports.
- [ ] Avoid retaining raw page content unless needed for cache or audit, and define the retention window.
- [ ] Provide export and deletion paths for pilot data.

### Access control

- [ ] Require authenticated staff access for reading-list management and exports.
- [ ] Use private, unlisted, revocable links for student access.
- [ ] Separate staff review/reporting views from student reading views.
- [ ] Do not expose profile metadata in public links, URLs, page titles, or share previews.

### Content and student safety

- [ ] Restrict pilot transforms to approved domains or staff-provided URLs.
- [ ] Keep server-side URL validation and block private, local, unsupported, and oversized targets.
- [ ] Add stricter fallback behavior for ambiguous or age-inappropriate content.
- [ ] Preserve source attribution and avoid presenting transformed content as official source text.
- [ ] Show clear failure states when a page cannot be transformed safely.

### Vendor and compliance readiness

- [ ] Document which vendors process URLs, extracted content, prompts, generated HTML, telemetry, and account data.
- [ ] Prepare plain-language FERPA/COPPA-adjacent questions for counsel, without claiming compliance before review.
- [ ] Keep payment, roster import, and SSO out of the first pilot unless legally reviewed.
- [ ] Maintain an incident-response contact and escalation path for the pilot sponsor.

## Metrics plan

| Metric | Target for first pilot | Collection method | Why it matters |
|---|---:|---|---|
| Transform success rate | 80%+ | Job status counts by approved URL | Shows reliability on real reading lists |
| Median uncached transform time | Under 60 seconds | Backend timing per job | Shows staff workflow viability |
| Before/after axe issue count | 30%+ average reduction initially | axe-core run on original and transformed HTML | Gives deterministic accessibility evidence |
| Keyboard path completion | 90%+ on transformed reading view | Manual or Playwright checklist | Confirms non-mouse access |
| Student preference | 70%+ prefer Ditto for dense readings | 1-minute post-reading survey | Validates user value |
| Student confidence | Positive movement from baseline | Pre/post Likert item | Connects adaptation to learning support |
| Staff prep time saved | Directionally positive | Staff time log and interview | Connects to buyer ROI |
| Cache hit rate | Measured, then improved | Cache telemetry by content/profile hash | Controls cost as readings repeat |
| Safety/privacy incidents | 0 unresolved | Incident log | Required for trust |

### Minimum pilot report fields

- School or pilot code.
- Reading URL and canonical URL.
- Approved domain status.
- Profile category.
- Transform status and failure reason if any.
- Original score, transformed score, and axe issue summary.
- Transform duration and cache status.
- Staff reviewer and review timestamp.
- Student feedback aggregate, never unnecessary disability details.

## Implementation roadmap

### Phase 1: Pilot-safe control surface

- Add staff-created reading lists with approved-domain enforcement.
- Add revocable private share links for transformed readings.
- Add a staff review state before a transformed page is released.
- Add clear student-facing privacy copy and failure states.

### Phase 2: Evidence and reporting

- Add axe-core validation for transformed HTML.
- Add keyboard navigation checks for the student reading path.
- Create exportable pilot reports with minimal metadata.
- Add prompt/model/version metadata to report rows.

### Phase 3: Reliability and cost control

- Move transforms to asynchronous jobs.
- Add persistent cache by canonical URL, content hash, profile hash, model version, and prompt version.
- Add quotas by pilot account, URL, and domain.
- Track provider latency, token use, failure category, and estimated cost.

### Phase 4: Procurement readiness after pilot proof

- Prepare counsel-reviewed privacy/security documents.
- Add admin roles, audit logs, retention controls, and support playbooks.
- Evaluate SSO, roster import, and LMS integrations only after manual pilot demand is proven.
- Package case studies around measured access improvement and staff time saved.

## Immediate non-code next steps

1. Recruit 2 to 3 accessibility coordinators for discovery interviews.
2. Ask each coordinator for anonymized examples of painful reading workflows.
3. Create a one-page pilot brief from this operating plan.
4. Validate the metrics with coordinators before building dashboards.
5. Review data-retention and vendor-processing assumptions with counsel before a real student pilot.
