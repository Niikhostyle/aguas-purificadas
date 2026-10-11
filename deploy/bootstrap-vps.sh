#!/usr/bin/env bash
# Run ON the VPS as root once SSH is available.
# Usage: curl -fsSL https://raw.githubusercontent.com/Niikhostyle/aguas-purificadas/main/deploy/bootstrap-vps.sh | bash
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
apt-get install -y ca-certificates curl git ufw openssl

if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
fi
systemctl enable --now docker

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
  echo "Wrote $APP_DIR/.env"
fi

# App+db on loopback:3001 — reuse host nginx if present (avoid clobbering :3000)
export APP_HOST_PORT="${APP_HOST_PORT:-3001}"
docker compose -f docker-compose.prod.yml up -d --build db app

if command -v nginx >/dev/null 2>&1; then
  cp "$APP_DIR/deploy/nginx-mibidon.conf" /etc/nginx/sites-available/mibidon
  ln -sfn /etc/nginx/sites-available/mibidon /etc/nginx/sites-enabled/mibidon
  nginx -t
  systemctl reload nginx
  echo "Nginx vhost mibidon installed (coexists with other sites)."
else
  docker compose -f docker-compose.prod.yml --profile edge up -d caddy
  echo "No host nginx — started Caddy edge profile on :80/:443."
fi

echo "Waiting for app..."
for i in $(seq 1 90); do
  if curl -fsS "http://127.0.0.1:${APP_HOST_PORT}/" >/dev/null 2>&1; then
    echo "App is up on 127.0.0.1:${APP_HOST_PORT}"
    break
  fi
  sleep 5
done

docker compose -f docker-compose.prod.yml ps
echo "Done. Configure Cloudflare A @/www/* → this host, then open https://mibidon.cl"
echo "Super-admin: /admin/login?tenant=plataforma  (super@plataforma.demo / admin123)"
