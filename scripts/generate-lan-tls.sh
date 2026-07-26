#!/usr/bin/env bash
# Generate a self-signed TLS cert with IP SAN for LAN HTTPS demos.
# Usage:
#   bash scripts/generate-lan-tls.sh [IP]
#   TLS_IP=192.168.1.150 bash scripts/generate-lan-tls.sh
# Reads FRONTEND_URL from .env.production when IP is omitted.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

CERT_DIR="$ROOT_DIR/nginx/certs"
CERT_FILE="$CERT_DIR/cert.pem"
KEY_FILE="$CERT_DIR/key.pem"
DAYS="${TLS_DAYS:-825}"

log() { echo "[lan-tls] $*"; }

extract_ip_from_url() {
  local url="$1"
  # https://192.168.1.150:8443 → 192.168.1.150
  echo "$url" | sed -E 's|^[a-zA-Z]+://||; s|[:/].*||'
}

is_ipv4() {
  [[ "$1" =~ ^([0-9]{1,3}\.){3}[0-9]{1,3}$ ]]
}

IP="${1:-${TLS_IP:-}}"

if [[ -z "$IP" && -f .env.production ]]; then
  # shellcheck disable=SC1091
  FRONTEND_URL_LINE="$(grep -E '^FRONTEND_URL=' .env.production | tail -n1 || true)"
  if [[ -n "$FRONTEND_URL_LINE" ]]; then
    FRONTEND_URL_VALUE="${FRONTEND_URL_LINE#FRONTEND_URL=}"
    FRONTEND_URL_VALUE="${FRONTEND_URL_VALUE%\"}"
    FRONTEND_URL_VALUE="${FRONTEND_URL_VALUE#\"}"
    IP="$(extract_ip_from_url "$FRONTEND_URL_VALUE")"
  fi
fi

if [[ -z "$IP" ]]; then
  echo "Usage: bash scripts/generate-lan-tls.sh <LAN_IP>" >&2
  echo "Or set TLS_IP / FRONTEND_URL=https://LAN_IP:8443 in .env.production" >&2
  exit 1
fi

if ! is_ipv4 "$IP"; then
  echo "Expected an IPv4 address, got: $IP" >&2
  echo "For a hostname/domain, use a real CA (Let's Encrypt) instead." >&2
  exit 1
fi

mkdir -p "$CERT_DIR"

if [[ -f "$CERT_FILE" && -f "$KEY_FILE" && "${TLS_FORCE:-}" != "1" ]]; then
  if openssl x509 -in "$CERT_FILE" -noout -checkend 86400 >/dev/null 2>&1; then
    log "Cert already present and valid (>1 day left). Skipping (TLS_FORCE=1 to regenerate)."
    exit 0
  fi
  log "Existing cert is expired or invalid; regenerating..."
fi

OPENSSL_CNF="$(mktemp)"
trap 'rm -f "$OPENSSL_CNF"' EXIT

cat >"$OPENSSL_CNF" <<EOF
[req]
default_bits = 2048
prompt = no
default_md = sha256
distinguished_name = dn
x509_extensions = v3_req

[dn]
CN = ${IP}

[v3_req]
basicConstraints = CA:FALSE
keyUsage = digitalSignature, keyEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[alt_names]
IP.1 = ${IP}
EOF

log "Generating self-signed cert for IP ${IP} (${DAYS} days)..."
if command -v openssl >/dev/null 2>&1; then
  openssl req -x509 -nodes -newkey rsa:2048 \
    -keyout "$KEY_FILE" \
    -out "$CERT_FILE" \
    -days "$DAYS" \
    -config "$OPENSSL_CNF"
else
  docker run --rm \
    -v "$CERT_DIR":/certs \
    -v "$OPENSSL_CNF":/tmp/openssl.cnf:ro \
    alpine/openssl req -x509 -nodes -newkey rsa:2048 \
      -keyout /certs/key.pem \
      -out /certs/cert.pem \
      -days "$DAYS" \
      -config /tmp/openssl.cnf
fi

chmod 644 "$CERT_FILE"
chmod 600 "$KEY_FILE"
log "Wrote $CERT_FILE and $KEY_FILE"
log "Testers: https://${IP}:8443 (accept the browser warning once)"
