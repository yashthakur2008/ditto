# Ditto — Accessible Web, Your Way

Ditto rebuilds any webpage to match how **you** read — whether you use a screen reader, need dyslexia-friendly typography, want captions and transcripts, or prefer larger text and calmer layouts.

Paste a link, and Ditto scrapes the page, scores its accessibility, and returns a rebuilt HTML version tailored to your needs.

## Live demo

Deploy with **[Render](https://render.com)** (recommended) or Cloud Run / Vercel — see [Deploy](#deploy) below.

| | URL |
|---|---|
| **Frontend** | `https://ditto-web.onrender.com` (after Blueprint deploy) |
| **Backend API** | `https://ditto-api.onrender.com` — docs at `/docs` |

## Quick start (local)

### 1. Backend

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

cp .env.example .env
# Add GEMINI_API_KEY (required for transform + chat)

uvicorn app.main:app --reload --port 8080
```

API docs → http://localhost:8080/docs

### 2. Frontend

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

App → http://localhost:3000

### 3. Browser extension (optional)

Load `extension/` unpacked in `chrome://extensions` to rebuild the active tab
with one click, no copy-paste required — see [`extension/README.md`](extension/README.md).

## How it works

```mermaid
flowchart LR
  Preferences["Preferences survey"] --> Chat["Paste URL in chat"]
  Chat --> Transform["POST /transform"]
  Transform --> Scrape["Scrape page"]
  Scrape --> Classify["Classify content"]
  Classify --> Gemini["Gemini rebuild"]
  Gemini --> Score["Score before/after"]
  Score --> Output["Sandboxed preview"]
```

1. **Preferences** — Tell Ditto how you see, hear, and read best (saved in your browser).
2. **Chat** — Paste any URL or ask Ditto questions. URLs trigger a full rebuild.
3. **Output** — View the rebuilt page with before/after accessibility scores.

**Cost/latency notes:** scraping and scoring the *original* page is cached
per URL (10 min) independent of profile, so rebuilding the same link for a
different profile skips the browser render and one Gemini call. Full
results are cached per (URL, profile) for 15 min. Scoring and content
classification run on `GEMINI_LIGHT_MODEL` (a cheaper model) — only the
page rebuild itself uses the full `GEMINI_MODEL`.

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Liveness + config flags |
| POST | `/transform` | Scrape URL → rebuild HTML for user profile |
| POST | `/transform/batch` | Rebuild up to 10 URLs at once with one profile |
| POST | `/chat` | Conversational Ditto replies (Gemini) |
| POST | `/voice/tts` | ElevenLabs text-to-speech (MP3) |
| POST | `/classify` | Pre-flight content safety for minors |
| POST | `/score` | Accessibility score without transforming |
| POST | `/save-profile` | Persist profile to Firestore |
| GET | `/get-profile/{uid}` | Load profile from Firestore |
| GET | `/history/{uid}` | Recent transforms for a user (opt-in — see Privacy) |
| GET | `/history/{uid}/report` | Downloadable CSV audit trail of before/after scores |
| POST | `/share` | Persist a rebuilt page, returns a short id for `/r/{id}` |
| GET | `/share/{id}` | Fetch a previously shared rebuilt page |

## Project layout

```
frontend/          Next.js 15 app (Ditto UI)
extension/         Manifest V3 browser extension — rebuild the active tab in one click
app/
  main.py          FastAPI entry point
  routers/         HTTP routes (transform, chat, voice, health, …)
  services/        Gemini, scraping, scoring, TTS, compliance
  models/          Pydantic request/response schemas
deploy.sh          Deploy backend to Cloud Run
cloudbuild.yaml    CI/CD for Cloud Run
render.yaml        One-click deploy to Render (API + frontend)
```

## Environment variables

See [`.env.example`](.env.example) (backend) and [`frontend/.env.example`](frontend/.env.example) (frontend).

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | Yes | Gemini API for transform, chat, scoring |
| `GEMINI_LIGHT_MODEL` | No | Cheaper model for scoring/classification (default `gemini-2.5-flash-lite`) |
| `ELEVENLABS_API_KEY` | No | Text-to-speech (`/voice/tts`) |
| `FIREBASE_PROJECT_ID` | No | Analytics + profile storage |
| `GOOGLE_MAPS_API_KEY` | No | Maps endpoints only |
| `CORS_ORIGINS` | Yes (prod) | Comma-separated frontend origins (auto on Render) |
| `NEXT_PUBLIC_BACKEND_URL` | Yes (prod) | Backend URL for the frontend (auto on Render) |

> Scraping uses **Playwright** (bundled in the Docker image) — no ActionLayer key needed.

## Deploy

### Render (recommended — one-click)

1. Push this repo to GitHub.
2. In [Render](https://dashboard.render.com) → **New** → **Blueprint**.
3. Connect the repo — Render reads [`render.yaml`](render.yaml).
4. When prompted, set **`GEMINI_API_KEY`** (from [Google AI Studio](https://aistudio.google.com/apikey)).
5. Deploy. Render wires `NEXT_PUBLIC_BACKEND_URL` and `CORS_ORIGINS` automatically.

| Service | Plan | Why |
|---------|------|-----|
| `ditto-api` | **Starter** ($7/mo) | Playwright needs ~1 GB RAM; free tier often OOMs |
| `ditto-web` | Free | Next.js frontend |

Optional env vars (set in Render dashboard → `ditto-api` → Environment):

| Variable | Required | Get it from |
|----------|----------|-------------|
| `GEMINI_API_KEY` | **Yes** | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) |
| `ELEVENLABS_API_KEY` | No | [elevenlabs.io](https://elevenlabs.io) → Profile → API Key |
| `FIREBASE_PROJECT_ID` | No | Firebase console |
| `GOOGLE_MAPS_API_KEY` | No | Google Cloud Console (unused by UI) |

**Cold starts:** Free/starter services spin down after inactivity. First request may take 30–60s.

### Backend (Cloud Run)

```bash
# Set CORS_ORIGINS to your Vercel URL before deploying
CORS_ORIGINS=https://your-app.vercel.app ./deploy.sh your-gcp-project-id
```

### Frontend (Vercel)

1. Import the `frontend/` directory in Vercel.
2. Set `NEXT_PUBLIC_BACKEND_URL` to your Cloud Run URL.
3. Deploy.

## Development

```bash
# Backend tests
pytest

# Frontend typecheck + lint
cd frontend && npm run typecheck && npm run lint
```

## Privacy

- Preferences are stored in **localStorage** in your browser.
- When you transform a page, Ditto sends the **URL** (and your accessibility profile) to the backend. We do not store your browsing history by default.
- Optional Firestore logging records transform metadata for analytics.
- If you turn on **"Remember my recent pages"** in preferences, Ditto stores a per-device history entry (URL, disability profile, timestamp) in Firestore under a random client ID, so you can revisit past rebuilds from the chat screen.
- Clicking **"Create share link"** on the output page publishes the rebuilt HTML (not your profile) to a public, unlisted URL (`/r/{id}`) that anyone with the link can view.

## License

MIT
