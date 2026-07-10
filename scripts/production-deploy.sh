#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "${ROOT}"

echo "==> NexSocio production deploy checklist"
echo ""
echo "  [ ] JWT_SECRET set (strong, unique — not dev-secret-change-in-production)"
echo "  [ ] POSTGRES_PASSWORD set (not default 'nexus' in real prod)"
echo "  [ ] VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY set (npx web-push generate-vapid-keys)"
echo "  [ ] CORS_ORIGINS includes https://nexsocio.com"
echo "  [ ] apps/web env: NEXT_PUBLIC_* URLs + Stripe keys (see .env.production.example)"
echo "  [ ] DNS: API subdomains point to this host / ingress"
echo "  [ ] WEBAUTHN_RP_ID=nexsocio.com on identity service"
echo "  [ ] Run ./scripts/security-audit.sh before go-live"
echo ""

if [[ -z "${JWT_SECRET:-}" ]]; then
  echo "ERROR: JWT_SECRET is required. Export it before running this script."
  exit 1
fi

if [[ -z "${VAPID_PUBLIC_KEY:-}" || -z "${VAPID_PRIVATE_KEY:-}" ]]; then
  echo "WARN: VAPID keys not set — notification service will fail to start."
fi

echo "==> Building and starting production stack..."
docker compose -f docker-compose.prod.yml up -d --build

echo ""
echo "==> Waiting for health endpoints..."
for port in 8001 8002 8003 8004 8005 8006 8007 8008 8009 8010; do
  for i in $(seq 1 30); do
    if curl -sf --connect-timeout 2 --max-time 3 "http://localhost:${port}/api/v1/health" >/dev/null 2>&1; then
      echo "  ✓ :${port}"
      break
    fi
    if [[ $i -eq 30 ]]; then
      echo "  ✗ :${port} (check: docker compose -f docker-compose.prod.yml logs)"
    fi
    sleep 2
  done
done

echo ""
echo "==> Deploy complete. Web app is deployed separately (Vercel). See ./scripts/deploy-vercel.sh"