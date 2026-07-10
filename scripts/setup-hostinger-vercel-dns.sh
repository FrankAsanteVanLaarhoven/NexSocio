#!/usr/bin/env bash
# Hostinger DNS for nexsocio.com → Vercel (web) + API subdomains
set -euo pipefail

HOSTINGER_EMAIL="${HOSTINGER_EMAIL:-frankleroyvan@gmail.com}"
API_HOST_IP="${API_HOST_IP:-}"

if [[ -z "${API_HOST_IP}" ]]; then
  API_HOST_IP=$(curl -s -m 5 https://api.ipify.org 2>/dev/null || true)
fi

cat <<EOF
Hostinger DNS setup for nexsocio.com
====================================

Login:  https://hpanel.hostinger.com
Email:  ${HOSTINGER_EMAIL}
Path:   Domains → nexsocio.com → DNS / DNS Zone

── Web (Vercel) — already configured if apex resolves to 76.76.21.21 ──

┌─────────┬──────┬────────────────────────┬───────┐
│ Type    │ Name │ Value                  │ TTL   │
├─────────┼──────┼────────────────────────┼───────┤
│ A       │ @    │ 76.76.21.21            │ 14400 │
│ CNAME   │ www  │ cname.vercel-dns.com   │ 14400 │
└─────────┴──────┴────────────────────────┴───────┘

── API subdomains (point to your API server / Caddy host) ──
EOF

if [[ -n "${API_HOST_IP}" ]]; then
  cat <<EOF

Detected public IP: ${API_HOST_IP}
(Set API_HOST_IP=your.vps.ip if this machine is not the API host)

┌─────────┬────────────────┬──────────────────┬───────┐
│ Type    │ Name           │ Value            │ TTL   │
├─────────┼────────────────┼──────────────────┼───────┤
│ A       │ identity       │ ${API_HOST_IP}   │ 14400 │
│ A       │ social         │ ${API_HOST_IP}   │ 14400 │
│ A       │ content        │ ${API_HOST_IP}   │ 14400 │
│ A       │ professional   │ ${API_HOST_IP}   │ 14400 │
│ A       │ safety         │ ${API_HOST_IP}   │ 14400 │
│ A       │ robot          │ ${API_HOST_IP}   │ 14400 │
│ A       │ hub            │ ${API_HOST_IP}   │ 14400 │
│ A       │ commerce       │ ${API_HOST_IP}   │ 14400 │
│ A       │ collaboration  │ ${API_HOST_IP}   │ 14400 │
│ A       │ notification   │ ${API_HOST_IP}   │ 14400 │
└─────────┴────────────────┴──────────────────┴───────┘

On the API host, run Caddy with: infrastructure/caddy/Caddyfile
EOF
else
  cat <<'EOF'

Could not detect public IP. Set API_HOST_IP and re-run:
  API_HOST_IP=your.server.ip ./scripts/setup-hostinger-vercel-dns.sh

Add A records for: identity, social, content, professional, safety,
robot, hub, commerce, collaboration, notification → your API server IP.
EOF
fi

cat <<'EOF'

Notes:
  • @ = apex (nexsocio.com). Some panels label it blank or "NEXSOCIO".
  • www CNAME must NOT point to 76.76.21.21 — use cname.vercel-dns.com only.
  • API subdomains use A records (not CNAME) to your Docker/Caddy host.
  • DNS can take 5–60 minutes to propagate.

Vercel (web):
  1. Project → Settings → Domains
  2. Add nexsocio.com and www.nexsocio.com
  3. Wait for "Valid Configuration" on both

Verify:
  ./scripts/verify-dns.sh
EOF