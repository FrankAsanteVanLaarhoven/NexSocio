#!/usr/bin/env bash
# Deploy NEXSOCIO web (apps/web) to Vercel with nexsocio.com
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WEB="${ROOT}/apps/web"

echo "NEXSOCIO → Vercel production deploy"
echo "  Monorepo root:  ${ROOT}"
echo "  App directory:  apps/web"
echo "  Domain:         nexsocio.com"
echo ""

if ! command -v vercel >/dev/null 2>&1; then
  echo "Using npx vercel..."
  VERCEL="npx vercel"
else
  VERCEL="vercel"
fi

cd "${ROOT}"

if [[ ! -d .vercel && -d "${WEB}/.vercel" ]]; then
  echo "Linking .vercel from apps/web..."
  cp -R "${WEB}/.vercel" "${ROOT}/.vercel"
fi

if [[ ! -d .vercel ]]; then
  echo "Linking Vercel project (first run)..."
  ${VERCEL} link
fi

if [[ "${1:-}" == "--sync-env" ]]; then
  "${ROOT}/scripts/vercel-env-sync.sh"
fi

echo "Deploying to production (full monorepo)..."
${VERCEL} deploy --prod --yes

echo ""
echo "Add domains in Vercel (if not linked to GitHub yet):"
echo "  vercel domains add nexsocio.com"
echo "  vercel domains add www.nexsocio.com"
echo ""
"${ROOT}/scripts/setup-hostinger-vercel-dns.sh"
echo ""
echo "Sync env vars: ./scripts/deploy-vercel.sh --sync-env"