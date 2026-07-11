#!/usr/bin/env bash
# Expose local APIs through ngrok (works on ASK4 / blocked port-forward networks)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
# shellcheck source=lib/resolve-ngrok.sh
source "${ROOT}/scripts/lib/resolve-ngrok.sh"
NGROK_CONFIG="${ROOT}/infrastructure/ngrok/ngrok.yml"
NGROK_EXAMPLE="${ROOT}/infrastructure/ngrok/ngrok.yml.example"

echo "╔══════════════════════════════════════════════════╗"
echo "║  NexSocio ngrok tunnel (ASK4 / no port forward)  ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

if ! resolve_ngrok_bin; then
  echo "ngrok 3.20+ required. Run: export PATH=\"/opt/homebrew/bin:\$PATH\""
  exit 1
fi
echo "Using ${NGROK_BIN}"

# ── Ensure prod stack + Caddy are up ──
if [[ ! -f "${ROOT}/.env.prod" ]]; then
  echo "Missing .env.prod — copy from .env.prod.example"
  exit 1
fi

echo "==> Starting Docker APIs + Caddy..."
docker compose -f "${ROOT}/docker-compose.prod.yml" --env-file "${ROOT}/.env.prod" up -d
"${ROOT}/scripts/start-caddy.sh" >/dev/null

MODE="${1:-}"

if [[ "${MODE}" == "--quick" ]]; then
  echo ""
  echo "==> Quick test tunnel (FREE ngrok — single URL, dev only)"
  echo "    Caddy on :80 receives traffic; subdomains won't match on free URL."
  echo "    Press Ctrl+C to stop."
  echo ""
  exec "${NGROK_BIN}" http 80
fi

if [[ "${MODE}" == "--paid" || -f "${NGROK_CONFIG}" ]]; then
  if [[ ! -f "${NGROK_CONFIG}" ]]; then
    cp "${NGROK_EXAMPLE}" "${NGROK_CONFIG}"
    echo "Created ${NGROK_CONFIG}"
    echo "Edit it: set authtoken + confirm reserved domains in ngrok dashboard."
    echo "Then re-run: ./scripts/tunnel-ngrok.sh --paid"
    exit 1
  fi
  if [[ -z "${NGROK_AUTHTOKEN:-}" ]]; then
    echo "Export your token from https://dashboard.ngrok.com/get-started/your-authtoken"
    echo "  export NGROK_AUTHTOKEN=..."
    exit 1
  fi
  echo ""
  echo "==> Starting multi-subdomain tunnel (ngrok paid + reserved domains)..."
  echo "    Update Hostinger API records: A → CNAME per ngrok dashboard."
  echo "    Press Ctrl+C to stop."
  echo ""
  exec "${NGROK_BIN}" start --all --config "${NGROK_CONFIG}"
fi

cat <<'EOF'
How to proceed on ASK4 (port forwarding blocked)
================================================

PATH 1 — Quick local test (FREE, 2 minutes)
  ./scripts/tunnel-ngrok.sh --quick
  → Opens one ngrok URL (e.g. https://abc123.ngrok-free.app)
  → Good for checking APIs run; NOT for production (single URL only).

PATH 2 — Full subdomains via ngrok (PAID ~$8/mo, works on ASK4)
  1. https://dashboard.ngrok.com → sign in → get authtoken
  2. export NGROK_AUTHTOKEN=your_token
  3. ngrok dashboard → Domains → reserve identity.nexsocio.com (+ others)
  4. cp infrastructure/ngrok/ngrok.yml.example infrastructure/ngrok/ngrok.yml
  5. Edit ngrok.yml — paste authtoken
  6. ./scripts/tunnel-ngrok.sh --paid
  7. Hostinger: change API A records to CNAME targets ngrok provides

PATH 3 — Production VPS (RECOMMENDED ~£5/mo, always on)
  ./scripts/deploy-vps.sh
  → Deploy on Hetzner/DigitalOcean; update Hostinger A records to VPS IP.

Your Mac (from Wi-Fi settings):
  Private IP: 10.182.131.112  → only for router forward (blocked on ASK4)
  Public IP:  31.205.42.159    → what DNS points to today

Keep running locally:
  docker compose -f docker-compose.prod.yml --env-file .env.prod up -d
  ./scripts/start-caddy.sh

Pick a path:
  ./scripts/tunnel-ngrok.sh --quick   # free test now
  ./scripts/tunnel-ngrok.sh --paid    # ngrok + real subdomains
  ./scripts/deploy-vps.sh             # production
EOF