#!/usr/bin/env bash
# Push NEXT_PUBLIC_* vars from .env.production.example to Vercel (production)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WEB="${ROOT}/apps/web"
ENV_FILE="${WEB}/.env.production.example"

if command -v vercel >/dev/null 2>&1; then
  VERCEL="vercel"
else
  VERCEL="npx vercel"
fi

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "Missing ${ENV_FILE}"
  exit 1
fi

cd "${ROOT}"

if [[ ! -d .vercel && -d "${WEB}/.vercel" ]]; then
  cp -R "${WEB}/.vercel" "${ROOT}/.vercel"
fi

if [[ ! -d .vercel ]]; then
  echo "Linking Vercel project nexsocio..."
  ${VERCEL} link --project nexsocio --yes
fi

vercel_env_set() {
  local key="$1"
  local value="$2"
  ${VERCEL} env rm "${key}" production --yes 2>/dev/null || true
  printf '%s' "${value}" | ${VERCEL} env add "${key}" production --force --yes
}

echo "Syncing NEXT_PUBLIC_* to Vercel production..."
while IFS= read -r line || [[ -n "${line}" ]]; do
  [[ -z "${line}" || "${line}" =~ ^# ]] && continue
  key="${line%%=*}"
  value="${line#*=}"
  value="${value%\"}"
  value="${value#\"}"
  [[ -z "${key}" ]] && continue
  [[ "${key}" != NEXT_PUBLIC_* ]] && continue
  [[ -z "${value}" || "${value}" == *"..."* ]] && continue
  echo "  ${key}=${value}"
  vercel_env_set "${key}" "${value}"
done < "${ENV_FILE}"

echo "Done. Redeploy: ./scripts/deploy-vercel.sh"