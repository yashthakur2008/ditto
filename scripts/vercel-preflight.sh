#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

fail() {
  echo "Vercel preflight failed: $*" >&2
  exit 1
}

[[ -f frontend/package.json ]] || fail "frontend/package.json missing"
[[ -f frontend/vercel.json ]] || fail "frontend/vercel.json missing"
[[ -f VERCEL_DEPLOYMENT.md ]] || fail "VERCEL_DEPLOYMENT.md missing"

grep -q '"framework"[[:space:]]*:[[:space:]]*"nextjs"' frontend/vercel.json || fail "frontend/vercel.json must set framework=nextjs"
grep -q '"buildCommand"[[:space:]]*:[[:space:]]*"npm run build"' frontend/vercel.json || fail "frontend/vercel.json must run npm run build"
grep -q 'NEXT_PUBLIC_BACKEND_URL' VERCEL_DEPLOYMENT.md || fail "deployment guide must document NEXT_PUBLIC_BACKEND_URL"
grep -q 'npx vercel --cwd frontend --prod' VERCEL_DEPLOYMENT.md || fail "deployment guide must document root-level Vercel deploy command"
grep -q 'CORS_ORIGINS' VERCEL_DEPLOYMENT.md || fail "deployment guide must document backend CORS follow-up"

(
  cd frontend
  npm run typecheck
  npm run build
)

echo "Vercel preflight passed. Next authenticated deploy command: npx vercel --cwd frontend --prod"
