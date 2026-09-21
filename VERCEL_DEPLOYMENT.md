# Vercel Deployment

This repo's Vercel target is the Next.js frontend in `frontend/`.

## Prerequisites

- Backend API deployed separately, for example on Render or Cloud Run.
- A public backend URL with `/health` reachable.
- Vercel account access from the CLI or dashboard.

## Required environment variable

Set this in the Vercel project:

```bash
NEXT_PUBLIC_BACKEND_URL=https://your-backend-api.example.com
```

Do not use a trailing slash. The frontend defaults to `http://localhost:8080` when this variable is missing, which is only correct for local development.

## Preflight check

Before deploying, run the repeatable preflight from the repository root:

```bash
./scripts/vercel-preflight.sh
```

It checks Vercel config/docs, then runs the frontend typecheck and production build.

## CLI deploy

From this repository root, you can deploy the frontend directly:

```bash
npx vercel login
npx vercel --cwd frontend --prod
```

Or run the same deploy from inside the frontend directory:

```bash
cd frontend
npx vercel login
npx vercel --prod
```

When prompted by Vercel:

- Framework preset: `Next.js`
- Root directory: current directory (`frontend`) if running from `frontend/`
- Build command: `npm run build`
- Install command: `npm install`
- Output directory: leave default

## Dashboard deploy

If importing the GitHub repo in the Vercel dashboard:

- Root Directory: `frontend`
- Framework Preset: `Next.js`
- Build Command: `npm run build`
- Install Command: `npm install`
- Environment Variable: `NEXT_PUBLIC_BACKEND_URL`

## Backend CORS reminder

After Vercel gives you a frontend URL, add that URL to the backend `CORS_ORIGINS` setting. Example:

```bash
CORS_ORIGINS=https://your-vercel-project.vercel.app
```

Without this, browser calls from the Vercel frontend to the backend may fail even when both services are deployed.
