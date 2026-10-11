#!/usr/bin/env bash
# Run ON the VPS as root once SSH is available.
# Usage: bash bootstrap-vps.sh
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/mibidon}"
REPO="${REPO:-https://github.com/Niikhostyle/aguas-purificadas.git}"
BRANCH="${BRANCH:-main}"

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Run as root" >&2
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y ca-certificates curl git ufw

if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
fi
systemctl enable --now docker

# Compose plugin
if ! docker compose version >/dev/null 2>&1; then
  apt-get install -y docker-compose-plugin || true
fi

ufw allow OpenSSH || true
ufw allow 80/tcp || true
ufw allow 443/tcp || true
ufw --force enable || true

mkdir -p "$APP_DIR"
if [[ ! -d "$APP_DIR/.git" ]]; then
  git clone --branch "$BRANCH" "$REPO" "$APP_DIR"
else
  git -C "$APP_DIR" fetch origin
  git -C "$APP_DIR" checkout "$BRANCH"
  git -C "$APP_DIR" pull --ff-only origin "$BRANCH"
fi

cd "$APP_DIR"

if [[ ! -f .env ]]; then
  POSTGRES_PASSWORD="$(openssl rand -hex 16)"
  ADMIN_SESSION_SECRET="$(openssl rand -hex 32)"
  cat > .env <<EOF
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
ADMIN_SESSION_SECRET=${ADMIN_SESSION_SECRET}
CREDENTIALS_ENCRYPTION_KEY=${ADMIN_SESSION_SECRET}
APP_URL=https://mibidon.cl
DEFAULT_TENANT_SLUG=rio-claro
WEBPAY_MODE=mock
RUN_SEED=true
EOF
  chmod 600 .env
  echo "Wrote $APP_DIR/.env (secrets generated)"
fi

docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d

echo "Waiting for app..."
for i in $(seq 1 60); do
  if curl -fsS http://127.0.0.1:3000/ >/dev/null 2>&1; then
    echo "App is up on :3000"
    break
  fi
  sleep 5
done

docker compose -f docker-compose.prod.yml ps
echo "Done. Open https://mibidon.cl and /admin/login?tenant=plataforma"
