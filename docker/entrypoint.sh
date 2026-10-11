#!/bin/sh
set -eu

echo "Waiting for database..."
# prisma migrate deploy retries via shell loop
i=0
until npx prisma migrate deploy; do
  i=$((i + 1))
  if [ "$i" -ge 30 ]; then
    echo "migrate deploy failed after retries" >&2
    exit 1
  fi
  echo "DB not ready, retry $i..."
  sleep 2
done

# Production must NOT auto-seed weak demos. Opt-in only.
if [ "${RUN_SEED:-false}" = "true" ]; then
  echo "Seeding database (requires SEED_* env; fails closed if missing)..."
  npx tsx prisma/seed.ts || echo "Seed skipped/failed (continuing)"
fi

exec npx next start --hostname 0.0.0.0 --port "${PORT:-3000}"
