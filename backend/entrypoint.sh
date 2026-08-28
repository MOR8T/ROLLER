#!/bin/sh
# Applies any pending migrations, then execs whatever the image's CMD is.
#
# Written as ENTRYPOINT + "$@" on purpose: docker-compose.override.yml replaces
# the *command* to add `--reload` in development, and that must not bypass the
# migration step. Anything Compose passes as `command:` lands in "$@" here.
#
# Compose gates this container on the database's healthcheck, so Postgres is
# already accepting connections by the time we run. `alembic upgrade head` is a
# no-op when the schema is current, so this is safe on every restart.
set -e

echo "[entrypoint] applying migrations..."
alembic upgrade head

echo "[entrypoint] starting: $*"
exec "$@"
