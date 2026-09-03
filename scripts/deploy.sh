#!/bin/sh
# Deploys the current state of the tracked branch to this server.
#
#     cd /opt/roller && ./scripts/deploy.sh
#
# Pulls config from git, images from GHCR, recreates only what changed, then
# waits for the containers to report healthy. Nothing is built here — the box
# does not have the RAM for `next build`; see .github/workflows/build-images.yml.
#
# Migrations need no step of their own: the backend's entrypoint runs
# `alembic upgrade head` before uvicorn on every start.
set -e

cd "$(dirname "$0")/.."
COMPOSE="docker compose -f docker-compose.prod.yml"

echo "==> git pull"
git pull --ff-only

echo "==> pulling images"
$COMPOSE pull

echo "==> starting"
$COMPOSE up -d

echo "==> waiting for health"
# The backend is the one that can legitimately take a while: on a release with
# new migrations it applies them before it starts answering.
for i in $(seq 1 60); do
  unhealthy=$($COMPOSE ps --format '{{.Name}} {{.Health}}' | awk '$2 != "" && $2 != "healthy" {print $1}')
  [ -z "$unhealthy" ] && break
  sleep 2
done

if [ -n "$unhealthy" ]; then
  echo "!! still not healthy: $unhealthy" >&2
  $COMPOSE ps
  echo "--- last 40 lines ---" >&2
  $COMPOSE logs --tail 40 $unhealthy >&2
  exit 1
fi

echo "==> reclaiming space from superseded images"
docker image prune -f >/dev/null

echo
$COMPOSE ps --format "table {{.Name}}\t{{.Status}}"
echo
echo "Deployed $(git rev-parse --short HEAD) — $(git log -1 --pretty=%s)"
