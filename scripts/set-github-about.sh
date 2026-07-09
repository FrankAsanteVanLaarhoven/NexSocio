#!/usr/bin/env bash
# Updates GitHub repository About section (description + topics).
# Requires: gh auth login  OR  GITHUB_TOKEN with repo scope
set -euo pipefail

OWNER="FrankAsanteVanLaarhoven"
REPO="NExsocio"

DESCRIPTION="NEXSOCIO — production social platform for feeds, connections, WebRTC calls & meetings, push inbox, marketplace, digital twins, and safety moderation. Multilingual Next.js PWA + 10 FastAPI microservices, zero-trust JWT, AWS/K8s."

HOMEPAGE="https://nexsocio.com"

TOPICS='["social-network","webrtc","nextjs","fastapi","microservices","pwa","typescript","python","real-time","kubernetes","social-media","video-conferencing"]'

if command -v gh >/dev/null 2>&1 && gh auth status >/dev/null 2>&1; then
  gh repo edit "${OWNER}/${REPO}" --description "${DESCRIPTION}" --homepage "${HOMEPAGE}"
  gh api -X PUT "repos/${OWNER}/${REPO}/topics" -f names='["social-network","webrtc","nextjs","fastapi","microservices","pwa","typescript","python","real-time","kubernetes","social-media","video-conferencing"]'
  echo "Updated via gh CLI."
  exit 0
fi

TOKEN="${GITHUB_TOKEN:-${GH_TOKEN:-}}"
if [[ -z "${TOKEN}" ]]; then
  echo "Set GITHUB_TOKEN or run: gh auth login"
  exit 1
fi

curl -fsS -X PATCH \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Accept: application/vnd.github+json" \
  "https://api.github.com/repos/${OWNER}/${REPO}" \
  -d "$(jq -n --arg d "${DESCRIPTION}" --arg h "${HOMEPAGE}" '{description: $d, homepage: $h}')"

curl -fsS -X PUT \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Accept: application/vnd.github+json" \
  "https://api.github.com/repos/${OWNER}/${REPO}/topics" \
  -d "{\"names\": ${TOPICS}}"

echo "Updated GitHub About for ${OWNER}/${REPO}"