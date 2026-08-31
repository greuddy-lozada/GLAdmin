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

# Re-exec after pull so we don't keep running a stale in-memory script body.
if [[ "${DEPLOY_REEXEC:-}" != "1" ]]; then
  export DEPLOY_REEXEC=1
  exec bash "$ROOT_DIR/scripts/deploy.sh"
fi

log "Ensuring LAN TLS certs exist..."
bash "$ROOT_DIR/scripts/generate-lan-tls.sh"

if [[ ! -f nginx/certs/cert.pem || ! -f nginx/certs/key.pem ]]; then
  echo "Missing nginx/certs/{cert,key}.pem after generate-lan-tls.sh." >&2
  exit 1
fi

log "Building frontend static export (NEXT_PUBLIC_API_URL=/api)..."
# node:22-slim tracks latest 22.x; 22.23+ undici can abort corepack's TLS download
# (assert(!this.paused)). Install a pinned pnpm with IPv4-first + retries instead.
docker run --rm \
  -v "$ROOT_DIR":/app \
  -w /app \
  -e HUSKY=0 \
  -e NEXT_PUBLIC_API_URL=/api \
  -e NEXT_PUBLIC_APP_NAME="${NEXT_PUBLIC_APP_NAME:-Cuadra}" \
  -e NODE_OPTIONS=--dns-result-order=ipv4first \
  node:22.21-bookworm \
  bash -c '
    set -euo pipefail
    PNPM_VERSION=10.18.3
    install_pnpm() {
      if command -v curl >/dev/null 2>&1 \
        && curl -fsSL "https://github.com/pnpm/pnpm/releases/download/v${PNPM_VERSION}/pnpm-linux-x64" \
          -o /usr/local/bin/pnpm; then
        chmod +x /usr/local/bin/pnpm
        return 0
      fi
      npm install -g "pnpm@${PNPM_VERSION}"
    }
    for attempt in 1 2 3 4 5; do
      if install_pnpm; then
        break
      fi
      if [[ "$attempt" -eq 5 ]]; then
        echo "Failed to install pnpm@${PNPM_VERSION}" >&2
        exit 1
      fi
      sleep $((attempt * 4))
    done
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

# Seed only on first bootstrap (empty orgs). Set FORCE_SEED=1 to re-run; SKIP_SEED=1 to never seed.
if [[ "${SKIP_SEED:-0}" == "1" ]]; then
  log "Skipping seed (SKIP_SEED=1)."
elif [[ "${FORCE_SEED:-0}" == "1" ]]; then
  log "Seeding database (FORCE_SEED=1)..."
  "${COMPOSE[@]}" exec -T backend npx tsx prisma/seed.ts
else
  ORG_COUNT="$("${COMPOSE[@]}" exec -T backend \
    node -e "const {PrismaClient}=require('@prisma/client'); const p=new PrismaClient(); p.organization.count().then(c=>{console.log(c); return p.\$disconnect();}).catch(()=>{console.log('err'); process.exit(1);})" \
    2>/dev/null | tr -d '\r' | tail -n1)"
  if [[ "$ORG_COUNT" == "0" ]]; then
    log "Empty database — running initial seed..."
    "${COMPOSE[@]}" exec -T backend npx tsx prisma/seed.ts
    log "WARNING: Change the seeded admin password after first login."
  else
    log "Database already has data — skipping seed (set FORCE_SEED=1 to override)."
  fi
fi

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
