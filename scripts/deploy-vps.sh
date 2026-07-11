#!/usr/bin/env bash
# One-command NexSocio API deploy on a Linux VPS (Ubuntu/Debian)
# Run ON THE VPS after SSH login — not on your Mac.
set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/FrankAsanteVanLaarhoven/NexSocio.git}"
INSTALL_DIR="${INSTALL_DIR:-/opt/nexsocio}"
BRANCH="${BRANCH:-main}"

echo "╔══════════════════════════════════════════════════╗"
echo "║  NexSocio VPS deploy (Docker + Caddy + APIs)     ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

if [[ "$(uname -s)" != "Linux" ]]; then
  echo "Run this script on your Linux VPS via SSH, not on macOS."
  echo "  ssh root@YOUR_VPS_IP 'bash -s' < scripts/deploy-vps.sh"
  exit 1
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "==> Installing Docker..."
  curl -fsSL https://get.docker.com | sh
  systemctl enable --now docker
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "ERROR: docker compose plugin missing after install"
  exit 1
fi

echo "==> Cloning/updating repo in ${INSTALL_DIR}..."
if [[ -d "${INSTALL_DIR}/.git" ]]; then
  git -C "${INSTALL_DIR}" fetch origin
  git -C "${INSTALL_DIR}" checkout "${BRANCH}"
  git -C "${INSTALL_DIR}" pull origin "${BRANCH}"
else
  git clone --branch "${BRANCH}" "${REPO_URL}" "${INSTALL_DIR}"
fi

cd "${INSTALL_DIR}"

if [[ ! -f .env.prod ]]; then
  echo "==> Creating .env.prod from example..."
  cp .env.prod.example .env.prod
  sed -i "s/generate-with-openssl-rand-hex-32/$(openssl rand -hex 32)/" .env.prod
  sed -i "s/strong-db-password-not-nexus/nexsocio_$(openssl rand -hex 8)/" .env.prod
  echo ""
  echo "EDIT REQUIRED: nano ${INSTALL_DIR}/.env.prod"
  echo "  Add VAPID keys: npx web-push generate-vapid-keys"
  echo "  Add Stripe keys when ready"
  echo ""
fi

echo "==> Building and starting full stack (APIs + Caddy)..."
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build

VPS_IP=$(curl -s -m 5 https://api.ipify.org || hostname -I | awk '{print $1}')
echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║  VPS deploy complete                             ║"
echo "╠══════════════════════════════════════════════════╣"
echo "║  Server IP: ${VPS_IP}"
echo "║  APIs:      ports 8001–8010 (internal)"
echo "║  HTTPS:     Caddy on 80/443"
echo "╠══════════════════════════════════════════════════╣"
echo "║  Hostinger DNS — point API A records to VPS IP:  ║"
echo "║    identity, social, content, professional,      ║"
echo "║    safety, robot, hub, commerce,                 ║"
echo "║    collaboration, notification                   ║"
echo "╠══════════════════════════════════════════════════╣"
echo "║  Test: curl -I https://identity.nexsocio.com/docs"
echo "║  Logs: docker compose -f docker-compose.prod.yml logs -f caddy"
echo "╚══════════════════════════════════════════════════╝"