#!/usr/bin/env bash
# Deploy Ditto backend to Cloud Run
set -euo pipefail

PROJECT_ID="${1:-$(gcloud config get-value project)}"
REGION="${REGION:-us-central1}"
SERVICE="${SERVICE:-synthesishacks}"
IMAGE="gcr.io/${PROJECT_ID}/${SERVICE}"

# Set CORS_ORIGINS to your Vercel frontend URL before deploying to production.
CORS_ORIGINS="${CORS_ORIGINS:-http://localhost:3000}"

echo "Building image..."
docker build -t "${IMAGE}" .

echo "Pushing to Container Registry..."
docker push "${IMAGE}"

echo "Deploying to Cloud Run..."
gcloud run deploy "${SERVICE}" \
  --image="${IMAGE}" \
  --region="${REGION}" \
  --platform=managed \
  --allow-unauthenticated \
  --project="${PROJECT_ID}" \
  --set-secrets="\
OPENAI_API_KEY=OPENAI_API_KEY:latest,\
CLAUDE_API_KEY=CLAUDE_API_KEY:latest,\
GOOGLE_MAPS_API_KEY=GOOGLE_MAPS_API_KEY:latest,\
ELEVENLABS_API_KEY=ELEVENLABS_API_KEY:latest" \
  --set-env-vars="\
FIREBASE_PROJECT_ID=${PROJECT_ID},\
CORS_ORIGINS=${CORS_ORIGINS},\
OPENAI_MODEL=gpt-4o-mini,\
CLAUDE_MODEL=claude-3-5-sonnet-latest,\
APP_ENV=production"

echo ""
echo "Done! Backend URL:"
gcloud run services describe "${SERVICE}" --region="${REGION}" --project="${PROJECT_ID}" \
  --format="value(status.url)"
echo ""
echo "Set NEXT_PUBLIC_BACKEND_URL in Vercel to this URL."
