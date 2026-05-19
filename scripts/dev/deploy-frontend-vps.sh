#!/usr/bin/env bash
set -euo pipefail

PLATFORM_DIR="${PLATFORM_DIR:-/opt/it-job/it-job-platform}"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"

log() {
  printf '>>> [%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*"
}

wait_http() {
  local url="$1"
  local name="$2"

  until curl -fsS "$url" >/dev/null 2>&1; do
    sleep 3
  done

  log "${name} is responding at ${url}"
}

cd "$PLATFORM_DIR"
log "pulling frontend image"
docker compose -f docker-compose.yml -f docker-compose.app.yml pull frontend

log "starting frontend container"
docker compose -f docker-compose.yml -f docker-compose.app.yml up -d --force-recreate frontend

wait_http "http://127.0.0.1:${FRONTEND_PORT}" frontend

log "frontend deployment completed"
