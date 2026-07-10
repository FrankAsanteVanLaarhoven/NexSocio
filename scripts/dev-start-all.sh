#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LOG_DIR="${ROOT}/.dev-logs"
mkdir -p "${LOG_DIR}"

export PYTHONPATH="${ROOT}/services:${ROOT}/libs/nexus-common"
export DATABASE_URL="${DATABASE_URL:-postgresql+asyncpg://nexus:nexus@localhost:5432/nexus}"
export JWT_SECRET="${JWT_SECRET:-dev-secret-change-in-production}"
export SOCIAL_GRAPH_SERVICE_URL="${SOCIAL_GRAPH_SERVICE_URL:-http://localhost:8002}"
export IDENTITY_SERVICE_URL="${IDENTITY_SERVICE_URL:-http://localhost:8001}"
export CONTENT_SERVICE_URL="${CONTENT_SERVICE_URL:-http://localhost:8003}"
export NOTIFICATION_SERVICE_URL="${NOTIFICATION_SERVICE_URL:-http://localhost:8010}"

# Never hang for minutes on a dead socket
CURL="curl -sf --connect-timeout 2 --max-time 3"

source "${ROOT}/.venv/bin/activate"

api_healthy() {
  local port=$1
  ${CURL} "http://localhost:${port}/api/v1/health" >/dev/null 2>&1 \
    || ${CURL} "http://localhost:${port}/health" >/dev/null 2>&1 \
    || ${CURL} "http://localhost:${port}/docs" >/dev/null 2>&1
}

echo "==> Starting Postgres + Redis..."
docker compose -f "${ROOT}/docker-compose.yml" up -d postgres redis

echo "==> Waiting for Postgres..."
for i in $(seq 1 30); do
  if docker compose -f "${ROOT}/docker-compose.yml" exec -T postgres pg_isready -U nexus >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

start_uvicorn() {
  local name=$1
  local module=$2
  local port=$3
  if lsof -iTCP:"${port}" -sTCP:LISTEN -t >/dev/null 2>&1; then
    if api_healthy "${port}"; then
      echo "  [skip] ${name} already healthy on :${port}"
      return
    fi
    echo "  [restart] ${name} :${port} (port open but not responding)"
    lsof -tiTCP:"${port}" -sTCP:LISTEN | xargs kill 2>/dev/null || true
    sleep 0.5
  else
    echo "  [start] ${name} :${port}"
  fi
  nohup uvicorn "${module}" --host 0.0.0.0 --port "${port}" --reload \
    > "${LOG_DIR}/${name}.log" 2>&1 &
  echo $! > "${LOG_DIR}/${name}.pid"
}

echo "==> Starting backend services..."
start_uvicorn identity       "services.identity.api.main:app"       8001
start_uvicorn social         "services.social_graph.api.main:app"   8002
start_uvicorn content        "services.content.api.main:app"        8003
start_uvicorn professional   "services.professional.api.main:app"   8004
start_uvicorn safety         "services.safety.api.main:app"         8005
start_uvicorn robot          "services.robot_agent.api.main:app"    8006
start_uvicorn hub            "services.hub.api.main:app"            8007
start_uvicorn commerce       "services.commerce.api.main:app"       8008
start_uvicorn notification   "services.notification.api.main:app"   8010
start_uvicorn collaboration  "services.collaboration.api.main:app"  8009

echo "==> Waiting for APIs..."
for port in 8001 8002 8003 8004 8005 8006 8007 8008 8009 8010; do
  for i in $(seq 1 20); do
    if api_healthy "${port}"; then
      echo "  ✓ :${port}"
      break
    fi
    if [[ $i -eq 20 ]]; then
      echo "  ✗ :${port} (check ${LOG_DIR})"
    fi
    sleep 0.5
  done
done

if lsof -iTCP:3000 -sTCP:LISTEN -t >/dev/null 2>&1 && ${CURL} "http://localhost:3000" >/dev/null 2>&1; then
  echo "==> Web already on :3000"
else
  if lsof -iTCP:3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "==> Restarting web (stale or error)..."
    lsof -tiTCP:3000 -sTCP:LISTEN | xargs kill 2>/dev/null || true
    sleep 1
  else
    echo "==> Starting Next.js web..."
  fi
  cd "${ROOT}/apps/web"
  nohup npm run dev:clean > "${LOG_DIR}/web.log" 2>&1 &
  echo $! > "${LOG_DIR}/web.pid"
fi

echo "==> Waiting for web..."
for i in $(seq 1 45); do
  if ${CURL} "http://localhost:3000" >/dev/null 2>&1; then
    echo "  ✓ http://localhost:3000"
    break
  fi
  if [[ $i -eq 45 ]]; then
    echo "  ✗ http://localhost:3000 (check ${LOG_DIR}/web.log)"
  fi
  sleep 1
done

echo ""
echo "NexSocio is ready:"
echo "  Web:           http://localhost:3000"
echo "  Identity:      http://localhost:8001/docs"
echo "  Social:        http://localhost:8002/docs"
echo "  Content:       http://localhost:8003/docs"
echo "  Professional:  http://localhost:8004/docs"
echo "  Safety:        http://localhost:8005/docs"
echo "  Robot:         http://localhost:8006/docs"
echo "  Hub:           http://localhost:8007/docs"
echo "  Commerce:      http://localhost:8008/docs"
echo "  Collaboration: http://localhost:8009/docs"
echo "  Notification:  http://localhost:8010/docs"
echo ""
echo "Logs: ${LOG_DIR}/"
echo "Stop: ./scripts/dev-stop-all.sh"