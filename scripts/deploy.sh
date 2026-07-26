#!/usr/bin/env bash
# Idempotent production deploy for Cuadra on a Docker VPS.
# Usage (from repo root on the server): bash scripts/deploy.sh
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

COMPOSE=(docker compose --env-file .env.production -f docker-compose.prod.yml)
BRANCH="${DEPLOY_BRANCH:-dev}"
SMOKE_URL="${SMOKE_URL:-https://127.0.0.1:8443/api/health}"

log() { echo "[deploy] $*"; }

if [[ ! -f .env.production ]]; then
  echo "Missing .env.production. Copy .env.production.example and edit it first." >&2
  exit 1
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is required but not installed." >&2
  exit 1
fi

log "Updating code to origin/${BRANCH}..."
git fetch origin "$BRANCH"
git reset --hard "origin/${BRANCH}"

log "Ensuring LAN TLS certs exist..."
bash "$ROOT_DIR/scripts/generate-lan-tls.sh"

if [[ ! -f nginx/certs/cert.pem || ! -f nginx/certs/key.pem ]]; then
  echo "Missing nginx/certs/{cert,key}.pem after generate-lan-tls.sh." >&2
  exit 1
fi

log "Building frontend static export (NEXT_PUBLIC_API_URL=/api)..."
docker run --rm \
  -v "$ROOT_DIR":/app \
  -w /app \
  -e HUSKY=0 \
  -e NEXT_PUBLIC_API_URL=/api \
  -e NEXT_PUBLIC_APP_NAME="${NEXT_PUBLIC_APP_NAME:-Cuadra}" \
  node:22-slim \
  bash -c '
    set -euo pipefail
    apt-get update -y >/dev/null
    apt-get install -y --no-install-recommends ca-certificates >/dev/null
    corepack enable
    corepack prepare pnpm@10 --activate
    pnpm install --frozen-lockfile
    pnpm --filter frontend build
  '

if [[ ! -d frontend/out ]]; then
  echo "frontend/out was not produced. Aborting." >&2
  exit 1
fi

log "Starting services..."
"${COMPOSE[@]}" up -d --build

log "Waiting for backend to become healthy..."
for i in $(seq 1 60); do
  if "${COMPOSE[@]}" exec -T backend \
    node -e "fetch('http://127.0.0.1:4000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))" \
    2>/dev/null; then
    break
  fi
  if [[ "$i" -eq 60 ]]; then
    echo "Backend did not become healthy in time." >&2
    "${COMPOSE[@]}" ps >&2 || true
    exit 1
  fi
  sleep 2
done

log "Running Prisma migrations..."
"${COMPOSE[@]}" exec -T backend npx prisma migrate deploy

log "Seeding database (no-op if already seeded)..."
"${COMPOSE[@]}" exec -T backend npx tsx prisma/seed.ts

smoke() {
  if command -v curl >/dev/null 2>&1; then
    # -k: self-signed LAN cert
    curl -skf "$SMOKE_URL" >/dev/null
  elif command -v wget >/dev/null 2>&1; then
    wget --no-check-certificate -q -O /dev/null "$SMOKE_URL"
  else
    echo "Need curl or wget for smoke check." >&2
    return 1
  fi
}

log "Smoke check ${SMOKE_URL}..."
for i in $(seq 1 30); do
  if smoke; then
    log "Deploy successful."
    exit 0
  fi
  sleep 2
done

echo "Smoke check failed: ${SMOKE_URL}" >&2
exit 1
