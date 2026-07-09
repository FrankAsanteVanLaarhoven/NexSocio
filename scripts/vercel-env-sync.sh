#!/usr/bin/env bash
# Push NEXT_PUBLIC_* vars from .env.production.example to Vercel (production)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WEB="${ROOT}/apps/web"
ENV_FILE="${WEB}/.env.production.example"

if ! command -v vercel >/dev/null 2>&1; then
  echo "Install Vercel CLI: npm install -g vercel"
  exit 1
fi

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "Missing ${ENV_FILE}"
  exit 1
fi

cd "${WEB}"

if [[ ! -d .vercel ]]; then
  echo "Run vercel link in apps/web first."
  exit 1
fi

while IFS= read -r line || [[ -n "${line}" ]]; do
  [[ -z "${line}" || "${line}" =~ ^# ]] && continue
  key="${line%%=*}"
  value="${line#*=}"
  value="${value%\"}"
  value="${value#\"}"
  [[ -z "${key}" ]] && continue
  echo "  ${key}"
  printf '%s' "${value}" | vercel env add "${key}" production --force
done < "${ENV_FILE}"

echo "Done. Redeploy: cd apps/web && vercel deploy --prod"