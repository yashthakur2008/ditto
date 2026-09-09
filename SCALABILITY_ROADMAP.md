# Startup Scalability Roadmap

Current startup scalability rating: **5.5 / 10**.

This repo has a strong MVP slice: FastAPI backend, Next.js frontend, Chrome extension, Playwright scraping, OpenAI-powered transforms/chat/scoring, Claude-powered agent actions, Firebase-backed optional profile/history, sharing, and TTS. The next jump is not more demo features. It is reliability, cost control, safety, and operating discipline.

For the first fundable wedge, see [`STARTUP_PILOT_PLAN.md`](STARTUP_PILOT_PLAN.md).

## Highest-priority fixes

### 1. Move transforms to background jobs

**Problem:** `/transform` currently does expensive work inline: scrape, classify, LLM rebuild, score original, score result.

**Fix:**
- Add a `POST /transform/jobs` endpoint that returns `{job_id}` immediately.
- Add `GET /transform/jobs/{job_id}` for status and result polling.
- Run jobs through a worker queue such as Cloud Tasks, Redis Queue, Celery, or a managed queue.
- Keep synchronous `/transform` only for local dev or small pages.

**Success metric:** p95 API request latency under 500ms for job creation, while workers can process slower transforms independently.

### 2. Add quotas, rate limits, and abuse controls

**Problem:** Arbitrary URL scraping plus LLM calls can be abused and can run up cost quickly.

**Fix:**
- Rate limit by IP and authenticated user.
- Add daily transform quotas per plan.
- Add per-domain concurrency limits.
- Add maximum HTML/token budgets by tier.
- Return clear `429` and quota messages.

**Success metric:** one user/IP cannot trigger unbounded browser sessions or LLM spend.

### 3. Add persistent caching

**Problem:** Current transform caches are in-memory and per-process. They disappear on deploy/restart and do not share across instances.

**Fix:**
- Store scrape records and transform results in Firestore, Redis, Postgres, or object storage.
- Cache by canonical URL, content hash, profile hash, model version, and prompt version.
- Store transformed HTML separately from metadata when large.
- Add cache hit/miss metrics.

**Success metric:** repeat transforms of the same URL/profile hit persistent cache across instances.

### 4. Harden arbitrary URL fetching

**Problem:** Scraping user-provided URLs is a major SSRF, malware, and abuse surface.

**Fix:**
- Resolve DNS and reject private, loopback, link-local, multicast, and cloud metadata IPs.
- Re-check resolved IPs after redirects.
- Set strict request and browser timeouts.
- Limit response size and content type.
- Disable downloads and file URL access in Playwright contexts.
- Log blocked URL reasons without storing sensitive page content.

**Success metric:** URL validation tests cover redirects, DNS rebinding-style cases, private hostnames, oversized responses, and non-HTTP schemes.

### 5. Add observability and cost tracking

**Problem:** Startup operation needs to know what fails, what costs money, and where latency comes from.

**Fix:**
- Add structured logs with request/job IDs.
- Track scrape time, LLM time, score time, total time, cache status, provider, model, input/output tokens, estimated cost, and failure category.
- Add dashboards and alerts for error rate, p95 latency, queue depth, and daily spend.

**Success metric:** an operator can answer, “What broke, for whom, and how much did it cost?” within minutes.

### 6. Add auth, accounts, and billing hooks

**Problem:** The product has preferences and optional history, but startup-scale distribution needs identity, plans, and metering.

**Fix:**
- Add sign-in with Firebase Auth, Clerk, Auth0, or Supabase Auth.
- Attach jobs, history, quotas, and share links to users.
- Add plan limits and Stripe billing hooks.
- Keep an anonymous trial path with strict limits.

**Success metric:** paid users get higher limits, anonymous users cannot abuse the service, and usage is attributable.

### 7. Make LLM calls production-grade

**Problem:** Provider calls are thin wrappers. They need retries, structured output, fallback, and telemetry.

**Fix:**
- Enforce JSON mode or schema validation for classification/scoring.
- Add retry with exponential backoff for transient provider errors.
- Add provider timeout handling and user-friendly failure states.
- Version prompts and store prompt/model version in cache metadata.
- Consider fallback models for partial degradation.

**Success metric:** malformed LLM output does not break transforms, and transient provider failures recover or degrade gracefully.

### 8. Prove accessibility quality

**Problem:** LLM scoring is useful for demos, but accessibility claims need stronger proof.

**Fix:**
- Add axe-core checks for transformed HTML.
- Add keyboard navigation tests for app flows.
- Add screen-reader-oriented manual test scripts.
- Test with real users across dyslexia, low vision, blind, deaf, ADHD, tremor, and elderly profiles.
- Track before/after WCAG issue counts, not just LLM scores.

**Success metric:** accessibility improvements are measurable, reproducible, and credible to buyers/users.

## Suggested implementation order

1. URL security hardening and rate limits.
2. Background job API and worker queue.
3. Persistent cache with cache metrics.
4. Observability and cost tracking.
5. Auth, user-linked history, quotas, and billing hooks.
6. Structured LLM outputs, retries, and prompt/model versioning.
7. axe-core and keyboard/screen-reader validation.
8. Product/legal packaging for personal accessibility use.

## Near-term target

A realistic next milestone is **7.5 / 10 startup scalability**:

- Async transform jobs are live.
- Abuse controls exist.
- Cache survives restarts and scales across instances.
- Operators can see errors, latency, and spend.
- URL fetching is hardened.
- Accessibility quality is tested beyond the LLM.

## Important caveats

This roadmap is based on source inspection and existing validation runs. It is not a substitute for:

- Load testing.
- Cost modeling against real traffic.
- Security audit.
- Legal review.
- Live provider integration testing with production keys.
