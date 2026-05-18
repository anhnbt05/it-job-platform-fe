#!/usr/bin/env bash
set -euo pipefail

FRONTEND_DIR="${FRONTEND_DIR:-/opt/it-job/it-job-platform-fe}"
PLATFORM_DIR="${PLATFORM_DIR:-/opt/it-job/it-job-platform}"

cd "$FRONTEND_DIR"

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

log "building frontend image"
cd "$PLATFORM_DIR"
docker compose -f docker-compose.yml -f docker-compose.app.yml build frontend

log "starting frontend container"
docker compose -f docker-compose.yml -f docker-compose.app.yml up -d frontend

wait_http http://127.0.0.1/ frontend

log "frontend deployment completed"
