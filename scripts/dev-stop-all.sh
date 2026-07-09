#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LOG_DIR="${ROOT}/.dev-logs"

if [[ -d "${LOG_DIR}" ]]; then
  for pidfile in "${LOG_DIR}"/*.pid; do
    [[ -f "${pidfile}" ]] || continue
    pid=$(cat "${pidfile}")
    kill "${pid}" 2>/dev/null || true
    rm -f "${pidfile}"
  done
fi

pkill -f "uvicorn services\." 2>/dev/null || true
pkill -f "next dev" 2>/dev/null || true

docker compose -f "${ROOT}/docker-compose.yml" stop postgres redis 2>/dev/null || true

echo "All dev services stopped."