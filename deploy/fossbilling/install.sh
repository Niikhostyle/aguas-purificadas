#!/usr/bin/env bash
# Installs FOSSBilling on the MiBidón VPS (Ubuntu 22.04, host nginx, ~2 GB RAM).
# Idempotent: re-running keeps the existing DB password and install dir.
# Secrets are generated on the server and written only to $CRED_FILE.
set -euo pipefail

FB_VERSION="${FB_VERSION:-0.8.8}"
FB_SHA256="${FB_SHA256:-6ab8cb04ad8ace31622caa1d999dbc3b1ffd89143bcd650986d1302830fb08a5}"
FB_DIR="${FB_DIR:-/var/www/fossbilling}"
FB_DOMAIN="${FB_DOMAIN:-billing.mibidon.cl}"
PHP_VER="${PHP_VER:-8.3}"
MARIADB_VER="${MARIADB_VER:-11.4}"
DB_NAME="${DB_NAME:-fossbilling}"
DB_USER="${DB_USER:-fossbilling}"
CRED_FILE="${CRED_FILE:-/root/fossbilling-credentials.txt}"
HERE="$(cd "$(dirname "$0")" && pwd)"

export DEBIAN_FRONTEND=noninteractive

if ! swapon --show | grep -q .; then
  fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
  grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

apt-get update -q
apt-get install -y -q software-properties-common curl unzip ca-certificates gnupg apt-transport-https

# FOSSBilling 0.8.x needs PHP >= 8.3 (jammy ships 8.1) and MariaDB >= 11.4 (jammy ships 10.6).
if ! ls /etc/apt/sources.list.d/ | grep -q ondrej-ubuntu-php; then
  add-apt-repository -y ppa:ondrej/php
fi
if [ ! -f /etc/apt/sources.list.d/mariadb.list ]; then
  curl -fsSL https://r.mariadb.com/downloads/mariadb_repo_setup \
    | bash -s -- --mariadb-server-version="mariadb-${MARIADB_VER}" --skip-maxscale
fi
apt-get update -q

# MariaDB low-memory config must exist before first start.
install -d /etc/mysql/mariadb.conf.d
install -m 644 "$HERE/mariadb-lowmem.cnf" /etc/mysql/mariadb.conf.d/99-lowmem.cnf

apt-get install -y -q mariadb-server mariadb-client \
  "php${PHP_VER}-fpm" "php${PHP_VER}-cli" "php${PHP_VER}-curl" "php${PHP_VER}-xml" \
  "php${PHP_VER}-intl" "php${PHP_VER}-mysql" "php${PHP_VER}-mbstring" "php${PHP_VER}-gd" \
  "php${PHP_VER}-zip" "php${PHP_VER}-bcmath" "php${PHP_VER}-opcache"

# PHP-FPM pool: ondemand + small max_children to stay within RAM.
POOL="/etc/php/${PHP_VER}/fpm/pool.d/www.conf"
sed -i \
  -e 's/^pm = .*/pm = ondemand/' \
  -e 's/^pm.max_children = .*/pm.max_children = 4/' \
  -e 's/^;\?pm.process_idle_timeout = .*/pm.process_idle_timeout = 30s/' \
  -e 's/^;\?pm.max_requests = .*/pm.max_requests = 300/' \
  "$POOL"
install -m 644 "$HERE/php-fossbilling.ini" "/etc/php/${PHP_VER}/fpm/conf.d/99-fossbilling.ini"
install -m 644 "$HERE/php-fossbilling.ini" "/etc/php/${PHP_VER}/cli/conf.d/99-fossbilling.ini"
systemctl enable --now "php${PHP_VER}-fpm" mariadb
systemctl restart "php${PHP_VER}-fpm" mariadb

touch "$CRED_FILE" && chmod 600 "$CRED_FILE"
DB_PASS="$(grep '^db_password=' "$CRED_FILE" | cut -d= -f2- || true)"
if [ -z "$DB_PASS" ]; then
  DB_PASS="$(openssl rand -base64 33 | tr -dc 'A-Za-z0-9' | head -c 32)"
  {
    echo "# FOSSBilling ($FB_DOMAIN) - generated $(date -u +%FT%TZ)"
    echo "db_host=localhost"
    echo "db_name=$DB_NAME"
    echo "db_user=$DB_USER"
    echo "db_password=$DB_PASS"
  } >> "$CRED_FILE"
fi
mariadb <<SQL
CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';
ALTER USER '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, DROP, INDEX, ALTER, CREATE TEMPORARY TABLES, LOCK TABLES
  ON \`${DB_NAME}\`.* TO '${DB_USER}'@'localhost';
FLUSH PRIVILEGES;
SQL

if [ ! -f "$FB_DIR/index.php" ]; then
  TMP="$(mktemp -d)"
  curl -fsSL -o "$TMP/fb.zip" \
    "https://github.com/FOSSBilling/FOSSBilling/releases/download/${FB_VERSION}/FOSSBilling-${FB_VERSION}.zip"
  echo "${FB_SHA256}  $TMP/fb.zip" | sha256sum -c -
  install -d "$FB_DIR"
  unzip -q "$TMP/fb.zip" -d "$FB_DIR"
  rm -rf "$TMP"
fi
chown -R www-data:www-data "$FB_DIR"
find "$FB_DIR" -type d -exec chmod 755 {} +
find "$FB_DIR" -type f -exec chmod 644 {} +

echo "FOSSBilling ${FB_VERSION} staged in ${FB_DIR}. Next: nginx vhost (setup-nginx.sh) and installer."
