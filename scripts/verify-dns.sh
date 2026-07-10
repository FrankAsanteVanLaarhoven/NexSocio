#!/usr/bin/env bash
# Verify nexsocio.com DNS points to Vercel and API subdomains resolve
set -euo pipefail

echo "==> DNS verification for NexSocio"
echo ""

check() {
  local host=$1
  local expected_hint=$2
  local result
  result=$(dig +short "${host}" 2>/dev/null | head -1 || true)
  if [[ -n "${result}" ]]; then
    echo "  ✓ ${host} → ${result} ${expected_hint}"
  else
    echo "  ✗ ${host} — no DNS record (add in Hostinger)"
  fi
}

check "nexsocio.com" "(expect 76.76.21.21 or Vercel IP)"
check "www.nexsocio.com" "(expect cname.vercel-dns.com)"

for sub in identity social content professional safety robot hub commerce collaboration notification; do
  check "${sub}.nexsocio.com" "(expect your API server IP)"
done

echo ""
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
"${ROOT}/scripts/setup-hostinger-vercel-dns.sh"