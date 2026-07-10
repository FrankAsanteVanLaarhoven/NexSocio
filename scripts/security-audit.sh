#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "${ROOT}"

PASS=0
FAIL=0
SKIP=0

pass() {
  echo "  PASS: $1"
  PASS=$((PASS + 1))
}

fail() {
  echo "  FAIL: $1"
  FAIL=$((FAIL + 1))
}

skip() {
  echo "  SKIP: $1"
  SKIP=$((SKIP + 1))
}

echo "==> NexSocio security audit"
echo ""

# 1. Bandit (optional)
echo "── Bandit static analysis (services/)"
if command -v bandit >/dev/null 2>&1; then
  if bandit -r services/ -ll -q 2>/dev/null; then
    pass "bandit — no high/medium issues in services/"
  else
    fail "bandit — issues found in services/ (run: bandit -r services/ -ll)"
  fi
else
  skip "bandit not installed (pip install bandit)"
fi
echo ""

# 2. Default JWT secrets in .env.example
echo "── JWT secret placeholders in .env.example"
INSECURE_JWT_PATTERNS=(
  "dev-secret-change-in-production"
  "change-me"
  "your-secret"
  "supersecret"
  "jwt_secret"
)

JWT_ISSUES=0
if [[ -f .env.example ]]; then
  while IFS= read -r line; do
    [[ "${line}" =~ ^JWT_SECRET= ]] || continue
    value="${line#JWT_SECRET=}"
    for pattern in "${INSECURE_JWT_PATTERNS[@]}"; do
      if echo "${value}" | grep -qi "${pattern}"; then
        JWT_ISSUES=$((JWT_ISSUES + 1))
      fi
    done
  done < .env.example

  if [[ ${JWT_ISSUES} -eq 0 ]]; then
    pass ".env.example JWT_SECRET uses non-default placeholder"
  else
    fail ".env.example contains ${JWT_ISSUES} weak JWT_SECRET placeholder(s)"
  fi
else
  fail ".env.example not found"
fi
echo ""

# 3. Hardcoded secrets in source (exclude examples and compose dev defaults)
echo "── Hardcoded secret patterns in repo"
SECRET_HITS=0
SECRET_HITS=0
if command -v rg >/dev/null 2>&1; then
  SECRET_HITS=$(rg -i \
    --glob '!.git/**' \
    --glob '!node_modules/**' \
    --glob '!.venv/**' \
    --glob '!**/__pycache__/**' \
    --glob '!docker-compose.yml' \
    --glob '!scripts/dev*.sh' \
    --glob '!.env.example' \
    -c '(api[_-]?key|secret[_-]?key|password)\s*=\s*["\x27][^"\x27]{8,}' \
    services/ apps/ libs/ 2>/dev/null | awk -F: '{s+=$2} END {print s+0}') || SECRET_HITS=0
else
  SECRET_HITS=$(grep -rEi \
    '(api[_-]?key|secret[_-]?key|password)[[:space:]]*=[[:space:]]*["\x27][^"\x27]{8,}' \
    services/ apps/web/src libs/ \
    --exclude-dir=__pycache__ --exclude-dir=node_modules --exclude-dir=.next 2>/dev/null | wc -l | tr -d ' ') || SECRET_HITS=0
fi

if [[ "${SECRET_HITS}" -eq 0 ]]; then
  pass "no obvious hardcoded api_key/secret_key/password assignments"
else
  fail "${SECRET_HITS} potential hardcoded secret assignment(s) — review services/ and apps/"
fi
echo ""

# 4. Dev JWT in production compose
echo "── Production compose JWT enforcement"
if grep -q 'JWT_SECRET: ${JWT_SECRET:?JWT_SECRET required}' docker-compose.prod.yml 2>/dev/null; then
  pass "docker-compose.prod.yml requires JWT_SECRET"
else
  fail "docker-compose.prod.yml missing JWT_SECRET:? enforcement"
fi
echo ""

echo "═══════════════════════════════════════"
echo "SUMMARY: ${PASS} passed · ${FAIL} failed · ${SKIP} skipped"
echo "═══════════════════════════════════════"

if [[ ${FAIL} -gt 0 ]]; then
  exit 1
fi

exit 0