#!/usr/bin/env bash
# Run all 3 API exposure paths: ngrok quick → ngrok paid → VPS deploy
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "${ROOT}"

echo "╔══════════════════════════════════════════════════════════╗"
echo "║  NexSocio API go-live — ngrok quick · paid · VPS         ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# ── Step 0: Ensure stack is up ──
echo "==> [0/3] Docker APIs + Caddy"
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d
./scripts/start-caddy.sh

for port in 8001 8004; do
  code=$(curl -s -m 3 -o /dev/null -w "%{http_code}" "http://127.0.0.1:${port}/docs" || echo "000")
  echo "    localhost:${port} → ${code}"
done
echo ""

# ── Step 1: ngrok authtoken ──
if [[ -z "${NGROK_AUTHTOKEN:-}" ]]; then
  if [[ -f "${ROOT}/.env.ngrok" ]]; then
    set -a
    # shellcheck source=/dev/null
    source "${ROOT}/.env.ngrok"
    set +a
  fi
fi

if [[ -z "${NGROK_AUTHTOKEN:-}" ]]; then
  echo "==> [1/3] ngrok authtoken required"
  echo ""
  echo "  1. Open https://dashboard.ngrok.com/get-started/your-authtoken"
  echo "  2. Sign in (free account is fine for --quick)"
  echo "  3. Run:"
  echo "       echo 'NGROK_AUTHTOKEN=your_token' >> .env.ngrok"
  echo "       source .env.ngrok"
  echo "       ./scripts/go-live-apis.sh"
  echo ""
  echo "  Or one-liner:"
  echo "       NGROK_AUTHTOKEN=xxx ./scripts/go-live-apis.sh"
  exit 1
fi

ngrok config add-authtoken "${NGROK_AUTHTOKEN}" 2>/dev/null || true
echo "    ngrok authtoken configured"
echo ""

# ── Step 2: Quick tunnel test ──
echo "==> [2/3] ngrok QUICK test (background, 60s)"
pkill -f "ngrok http 80" 2>/dev/null || true
ngrok http 80 --log=stdout > /tmp/nexsocio-ngrok.log 2>&1 &
NGROK_PID=$!
sleep 5

QUICK_URL=""
for _ in $(seq 1 15); do
  QUICK_URL=$(curl -s -m 2 http://127.0.0.1:4040/api/tunnels 2>/dev/null \
    | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['tunnels'][0]['public_url'] if d.get('tunnels') else '')" 2>/dev/null || true)
  [[ -n "${QUICK_URL}" ]] && break
  sleep 1
done

if [[ -n "${QUICK_URL}" ]]; then
  echo "    ✓ Quick tunnel: ${QUICK_URL}"
  echo "    Dashboard:      http://127.0.0.1:4040"
  echo "    (Subdomains won't work on free URL — APIs use identity.nexsocio.com etc.)"
else
  echo "    ✗ Quick tunnel failed — see /tmp/nexsocio-ngrok.log"
  tail -5 /tmp/nexsocio-ngrok.log 2>/dev/null || true
fi
echo ""

# ── Step 3: Paid multi-subdomain setup ──
echo "==> [3/3] ngrok PAID + VPS"
NGROK_CONFIG="${ROOT}/infrastructure/ngrok/ngrok.yml"
if [[ ! -f "${NGROK_CONFIG}" ]]; then
  cp infrastructure/ngrok/ngrok.yml.example "${NGROK_CONFIG}"
  sed -i '' "s/YOUR_NGROK_AUTHTOKEN/${NGROK_AUTHTOKEN}/" "${NGROK_CONFIG}" 2>/dev/null \
    || sed -i "s/YOUR_NGROK_AUTHTOKEN/${NGROK_AUTHTOKEN}/" "${NGROK_CONFIG}"
fi

echo ""
echo "  PAID ngrok (full subdomains on ASK4):"
echo "    1. Upgrade: https://dashboard.ngrok.com/billing/subscription"
echo "    2. Reserve domains: identity.nexsocio.com … notification.nexsocio.com"
echo "    3. Stop quick tunnel: kill ${NGROK_PID}"
echo "    4. Run: ./scripts/tunnel-ngrok.sh --paid"
echo "    5. Hostinger: API A records → CNAME (targets from ngrok dashboard)"
echo ""
echo "  VPS production (recommended):"
echo "    1. Create VPS (Hetzner CX22 / DO droplet ~£5/mo)"
echo "    2. SSH: ssh root@YOUR_VPS_IP"
echo "    3. Run:  curl -fsSL https://raw.githubusercontent.com/FrankAsanteVanLaarhoven/NexSocio/main/scripts/deploy-vps.sh | bash"
echo "    4. Hostinger: API A records → VPS public IP"
echo "    5. Test:   curl -I https://identity.nexsocio.com/docs"
echo ""
echo "Quick tunnel still running (PID ${NGROK_PID}). Stop with: kill ${NGROK_PID}"