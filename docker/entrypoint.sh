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

if [ "${RUN_SEED:-true}" = "true" ]; then
  echo "Seeding database (idempotent upserts)..."
  npx tsx prisma/seed.ts || echo "Seed skipped/failed (continuing)"
fi

exec npx next start --hostname 0.0.0.0 --port "${PORT:-3000}"
