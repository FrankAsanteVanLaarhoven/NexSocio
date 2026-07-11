#!/usr/bin/env bash
# Start HTTPS reverse proxy for API subdomains (Docker — no separate Caddy install)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "${ROOT}"

if [[ ! -f .env.prod ]]; then
  echo "Missing .env.prod — copy from .env.prod.example first"
  exit 1
fi

echo "Starting Caddy (HTTPS for identity|professional|…nexsocio.com)..."
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d caddy

echo ""
echo "Caddy is running on ports 80 and 443."
echo "Ensure your router forwards 80/443 → this machine (31.205.42.159)."
echo ""
echo "Test after ~30s:"
echo "  curl -I https://identity.nexsocio.com/docs"
echo "  curl -I https://professional.nexsocio.com/docs"