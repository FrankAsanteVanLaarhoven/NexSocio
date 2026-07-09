#!/usr/bin/env bash
# Deploy NEXSOCIO web (apps/web) to Vercel with nexsocio.com
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WEB="${ROOT}/apps/web"
ENV_FILE="${WEB}/.env.production.example"

echo "NEXSOCIO → Vercel deploy"
echo "  Root directory: apps/web"
echo "  Domain:         nexsocio.com"
echo ""

if ! command -v vercel >/dev/null 2>&1; then
  echo "Installing Vercel CLI..."
  npm install -g vercel
fi

cd "${WEB}"

if [[ ! -d .vercel ]]; then
  echo "Linking project (first run)..."
  vercel link
fi

echo ""
echo "Sync production env vars from ${ENV_FILE}"
echo "Run once (or after URL changes):"
echo "  ./scripts/vercel-env-sync.sh"
echo ""

if [[ "${1:-}" == "--sync-env" ]]; then
  "${ROOT}/scripts/vercel-env-sync.sh"
fi

echo "Deploying to production..."
vercel deploy --prod

echo ""
echo "Add custom domain (if not already):"
echo "  vercel domains add nexsocio.com"
echo "  vercel domains add www.nexsocio.com"
echo ""
echo "DNS at your registrar:"
echo "  A     @   → 76.76.21.21"
echo "  CNAME www → cname.vercel-dns.com"
echo "  (or point nameservers to Vercel)"
echo ""
echo "API backends (identity.nexsocio.com, etc.) deploy separately — see README."