#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export PYTHONPATH="${ROOT}/services:${ROOT}/libs/nexus-common"
export DATABASE_URL="${DATABASE_URL:-postgresql+asyncpg://nexus:nexus@localhost:5432/nexus}"
export JWT_SECRET="${JWT_SECRET:-dev-secret-change-in-production}"

run_service() {
  local module=$1
  local port=$2
  cd "${ROOT}"
  uvicorn "${module}" --reload --port "${port}"
}

case "${1:-help}" in
  infra)
    docker compose -f "${ROOT}/docker-compose.yml" up -d postgres redis
    echo "Waiting for postgres..."
    sleep 3
    ;;
  identity)   run_service "services.identity.api.main:app" 8001 ;;
  social)     run_service "services.social_graph.api.main:app" 8002 ;;
  content)    run_service "services.content.api.main:app" 8003 ;;
  professional) run_service "services.professional.api.main:app" 8004 ;;
  safety)     run_service "services.safety.api.main:app" 8005 ;;
  robot)      run_service "services.robot_agent.api.main:app" 8006 ;;
  hub)        run_service "services.hub.api.main:app" 8007 ;;
  commerce)   run_service "services.commerce.api.main:app" 8008 ;;
  web)
    cd "${ROOT}/apps/web"
    npm run dev
    ;;
  all)
    "${ROOT}/scripts/dev.sh" infra
    echo "Start services in separate terminals:"
    echo "  ./scripts/dev.sh identity"
    echo "  ./scripts/dev.sh social"
    echo "  ./scripts/dev.sh content"
    echo "  ./scripts/dev.sh professional"
    echo "  ./scripts/dev.sh safety"
    echo "  ./scripts/dev.sh robot"
    echo "  ./scripts/dev.sh hub"
    echo "  ./scripts/dev.sh commerce"
    echo "  ./scripts/dev.sh web"
    ;;
  *)
    echo "Usage: ./scripts/dev.sh {infra|identity|social|content|professional|safety|robot|hub|commerce|web|all}"
    ;;
esac