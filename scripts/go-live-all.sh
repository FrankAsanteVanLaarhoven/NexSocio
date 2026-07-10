#!/usr/bin/env bash
# Full NexSocio go-live: Vercel deploy + domains + env + backend stack
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "${ROOT}"

if command -v vercel >/dev/null 2>&1; then
  VERCEL="vercel"
else
  VERCEL="npx vercel"
fi

echo "╔══════════════════════════════════════════════════╗"
echo "║  NexSocio go-live — domain · Stripe · APIs       ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

# ── 1. Vercel link + deploy + domains ──
echo "==> [1/4] Vercel (web PWA)"
if [[ ! -d .vercel ]]; then
  ${VERCEL} link --project nexsocio --yes
fi

echo "    Syncing NEXT_PUBLIC_* env vars..."
"${ROOT}/scripts/vercel-env-sync.sh" || echo "    (env sync skipped — run manually after vercel login)"

echo "    Deploying production..."
${VERCEL} deploy --prod --yes

echo "    Attaching domains..."
${VERCEL} domains add nexsocio.com 2>/dev/null || echo "    nexsocio.com — add in Vercel dashboard if needed"
${VERCEL} domains add www.nexsocio.com 2>/dev/null || echo "    www — add in Vercel dashboard if needed"
"${ROOT}/scripts/setup-hostinger-vercel-dns.sh"

# ── 2. Stripe checklist ──
echo ""
echo "==> [2/4] Stripe billing"
"${ROOT}/scripts/setup-stripe.sh"

# ── 3. Backend production stack ──
echo ""
echo "==> [3/4] Backend APIs (docker-compose.prod)"
if [[ ! -f "${ROOT}/.env.prod" ]]; then
  if [[ -z "${JWT_SECRET:-}" ]]; then
    export JWT_SECRET="$(openssl rand -hex 32)"
    echo "    Generated JWT_SECRET (save to .env.prod)"
  fi
  if [[ -z "${VAPID_PUBLIC_KEY:-}" || -z "${VAPID_PRIVATE_KEY:-}" ]]; then
    echo "    WARN: Generate VAPID keys: npx web-push generate-vapid-keys"
    echo "    Copy .env.prod.example → .env.prod and fill values"
  else
    cat > "${ROOT}/.env.prod" <<EOF
JWT_SECRET=${JWT_SECRET}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-$(openssl rand -hex 16)}
VAPID_PUBLIC_KEY=${VAPID_PUBLIC_KEY}
VAPID_PRIVATE_KEY=${VAPID_PRIVATE_KEY}
STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY:-}
STRIPE_WEBHOOK_SECRET=${STRIPE_WEBHOOK_SECRET:-}
STRIPE_BUSINESS_PRICE_ID=${STRIPE_BUSINESS_PRICE_ID:-}
STRIPE_CORPORATE_PRICE_ID=${STRIPE_CORPORATE_PRICE_ID:-}
PUBLIC_API_URL=https://professional.nexsocio.com
EOF
    echo "    Created .env.prod"
  fi
fi

if [[ -f "${ROOT}/.env.prod" ]]; then
  set -a
  # shellcheck source=/dev/null
  source "${ROOT}/.env.prod"
  set +a
  export JWT_SECRET
  docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
  echo "    API stack starting — Caddy config: infrastructure/caddy/Caddyfile"
else
  echo "    SKIP: create .env.prod from .env.prod.example first"
fi

# ── 4. DNS verify ──
echo ""
echo "==> [4/4] DNS verification"
"${ROOT}/scripts/verify-dns.sh" || true

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║  Go-live checklist                               ║"
echo "╠══════════════════════════════════════════════════╣"
echo "║  Web:     https://nexsocio.vercel.app            ║"
echo "║  Domain:  https://nexsocio.com (after DNS)       ║"
echo "║  APIs:    identity|professional|…nexsocio.com  ║"
echo "║  Stripe:  ./scripts/setup-stripe.sh              ║"
echo "║  Audit:   ./scripts/security-audit.sh            ║"
echo "╚══════════════════════════════════════════════════╝"