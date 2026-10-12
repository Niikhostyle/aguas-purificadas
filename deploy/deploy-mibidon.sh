#!/usr/bin/env bash
# Safe, zero-rm deploy for MiBidón on the VPS (installed as /root/deploy-mibidon.sh).
#
# Usage:
#   deploy-mibidon.sh <image.tar[.gz]|image:tag> [release-tag]
#   deploy-mibidon.sh ghcr.io/niikhostyle/aguas-purificadas:sha-abc1234   # built by GitHub Actions
#   deploy-mibidon.sh --rollback          # go back to mibidon-app:previous
#
# - Loads the image (docker load) when given a tarball, pulls registry refs (e.g. GHCR)
#   that are not present yet, or uses an existing local image.
# - Tags it mibidon-app:<release-tag> and mibidon-app:latest (the tag compose runs).
# - Keeps the outgoing image as mibidon-app:previous.
# - Swaps with `docker compose up -d --no-build app` (never `docker rm -f`).
# - Waits for the container healthcheck; rolls back automatically if it never gets healthy.
# - flock prevents overlapping deploys.
#
# Build-time note: NEXT_SERVER_ACTIONS_ENCRYPTION_KEY from /var/www/mibidon/.env must also be
# passed to `next build` (e.g. `docker build --build-arg NEXT_SERVER_ACTIONS_ENCRYPTION_KEY=...`
# with a matching ARG/ENV in the builder stage). Next uses it to salt Server Action IDs at build
# time, so unchanged actions keep the same ID across builds. At runtime the env value overrides
# the key embedded in the build. Never commit the key.
set -euo pipefail

APP_DIR=${APP_DIR:-/var/www/mibidon}
COMPOSE_FILE=${COMPOSE_FILE:-docker-compose.prod.yml}
SERVICE=${SERVICE:-app}
REPO=${REPO:-mibidon-app}
HEALTH_TIMEOUT=${HEALTH_TIMEOUT:-180}
LOCK_FILE=${LOCK_FILE:-/var/lock/deploy-mibidon.lock}
LOG_FILE=${LOG_FILE:-/var/log/deploy-mibidon.log}
PUBLIC_URL=${PUBLIC_URL:-}

log() { echo "[$(date -u +%FT%TZ)] $*" | tee -a "$LOG_FILE" >&2; }
die() { log "ERROR: $*"; exit 1; }

exec 9>"$LOCK_FILE"
flock -n 9 || die "another deploy is running (lock $LOCK_FILE)"

cd "$APP_DIR"
dc() { docker compose -f "$COMPOSE_FILE" "$@"; }

container_id() { dc ps -q "$SERVICE" 2>/dev/null | head -n1; }

wait_healthy() {
  local deadline=$(( $(date +%s) + HEALTH_TIMEOUT )) cid status
  while (( $(date +%s) < deadline )); do
    cid=$(container_id)
    if [[ -n "$cid" ]]; then
      status=$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$cid" 2>/dev/null || echo unknown)
      case "$status" in
        healthy) return 0 ;;
        exited|dead) log "container $cid is $status"; return 1 ;;
      esac
    fi
    sleep 3
  done
  log "timed out after ${HEALTH_TIMEOUT}s waiting for healthy"
  return 1
}

swap_to() {
  local image_id=$1
  docker tag "$image_id" "$REPO:latest"
  dc up -d --no-build --no-deps "$SERVICE"
  wait_healthy
}

smoke() {
  [[ -z "$PUBLIC_URL" ]] && return 0
  local code
  code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 15 "$PUBLIC_URL" || echo 000)
  [[ "$code" == 2* || "$code" == 3* ]] || { log "smoke $PUBLIC_URL -> $code"; return 1; }
}

rollback() {
  local prev
  prev=$(docker image inspect -f '{{.Id}}' "$REPO:previous" 2>/dev/null) || die "no $REPO:previous image to roll back to"
  log "rolling back to $REPO:previous ($prev)"
  swap_to "$prev" || die "rollback container did not become healthy; check: docker logs $(container_id)"
  log "rollback OK"
}

if [[ "${1:-}" == "--rollback" ]]; then
  rollback
  exit 0
fi

SRC=${1:?usage: $0 <image.tar[.gz]|image:tag> [release-tag] | --rollback}
TAG=${2:-release-$(date -u +%Y%m%d%H%M%S)}

if [[ -f "$SRC" ]]; then
  log "loading image from $SRC"
  loaded=$(docker load -i "$SRC" | sed -n 's/^Loaded image: //p; s/^Loaded image ID: //p' | tail -n1)
  [[ -n "$loaded" ]] || die "docker load produced no image"
  SRC=$loaded
elif [[ "$SRC" == */* ]] && ! docker image inspect "$SRC" >/dev/null 2>&1; then
  log "pulling $SRC"
  docker pull "$SRC" || die "docker pull $SRC failed (private GHCR needs: docker login ghcr.io)"
fi
NEW_ID=$(docker image inspect -f '{{.Id}}' "$SRC" 2>/dev/null) || die "image $SRC not found"

CUR_ID=$(docker image inspect -f '{{.Id}}' "$REPO:latest" 2>/dev/null || true)
if [[ -n "$CUR_ID" && "$CUR_ID" == "$NEW_ID" ]]; then
  log "$SRC is already $REPO:latest; recreating anyway"
elif [[ -n "$CUR_ID" ]]; then
  docker tag "$CUR_ID" "$REPO:previous"
  log "kept current image as $REPO:previous ($CUR_ID)"
fi

docker tag "$NEW_ID" "$REPO:$TAG"
log "deploying $SRC as $REPO:$TAG ($NEW_ID)"
dc config -q || die "compose config invalid"

if swap_to "$NEW_ID" && smoke; then
  log "deploy OK: $REPO:$TAG is healthy"
  docker image prune -f >/dev/null 2>&1 || true
  exit 0
fi

log "new image failed health check; recent logs:"
docker logs --tail 40 "$(container_id)" 2>&1 | tee -a "$LOG_FILE" >&2 || true
if [[ -n "$CUR_ID" && "$CUR_ID" != "$NEW_ID" ]]; then
  rollback
fi
exit 1
