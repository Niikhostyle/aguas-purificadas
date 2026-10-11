#!/usr/bin/env bash
# Drives the FOSSBilling web installer over HTTPS on the origin (no browser needed),
# then applies the post-install hardening from the docs.
# Admin password is generated here and stored only in $CRED_FILE.
set -euo pipefail

FB_DIR="${FB_DIR:-/var/www/fossbilling}"
FB_DOMAIN="${FB_DOMAIN:-billing.mibidon.cl}"
ADMIN_EMAIL="${ADMIN_EMAIL:-niikhostyle@gmail.com}"
ADMIN_NAME="${ADMIN_NAME:-MiBidón Admin}"
CURRENCY="${CURRENCY:-CLP}"
CRED_FILE="${CRED_FILE:-/root/fossbilling-credentials.txt}"

cred() { grep "^$1=" "$CRED_FILE" | cut -d= -f2-; }

if [ -f "$FB_DIR/config.php" ]; then
  echo "config.php exists; FOSSBilling already installed." >&2
  exit 0
fi

ADMIN_PASS="$(cred admin_password || true)"
if [ -z "$ADMIN_PASS" ]; then
  ADMIN_PASS="Mb$(openssl rand -base64 30 | tr -dc 'A-Za-z0-9' | head -c 22)7x"
  {
    echo "admin_url=https://${FB_DOMAIN}/admin"
    echo "admin_email=${ADMIN_EMAIL}"
    echo "admin_password=${ADMIN_PASS}"
  } >> "$CRED_FILE"
fi

JAR="$(mktemp)"
CURL=(curl -sk --resolve "${FB_DOMAIN}:443:127.0.0.1" -b "$JAR" -c "$JAR")
"${CURL[@]}" -o /dev/null "https://${FB_DOMAIN}/install/install.php"
OUT="$(mktemp)"
CODE="$("${CURL[@]}" -o "$OUT" -w '%{http_code}' \
  --data-urlencode "system_url=https://${FB_DOMAIN}/" \
  --data-urlencode "currency_code=${CURRENCY}" \
  --data-urlencode "database_hostname=localhost" \
  --data-urlencode "database_port=3306" \
  --data-urlencode "database_name=$(cred db_name)" \
  --data-urlencode "database_username=$(cred db_user)" \
  --data-urlencode "database_password=$(cred db_password)" \
  --data-urlencode "admin_name=${ADMIN_NAME}" \
  --data-urlencode "admin_email=${ADMIN_EMAIL}" \
  --data-urlencode "admin_password=${ADMIN_PASS}" \
  "https://${FB_DOMAIN}/install/install.php?a=install")"
rm -f "$JAR"
if [ "$CODE" != "200" ] || [ ! -f "$FB_DIR/config.php" ]; then
  echo "Installer failed (HTTP $CODE):" >&2
  sed -e 's/<[^>]*>//g' "$OUT" | tr -s ' \n' | grep -iE 'error|exception|fail|invalid|password' | head -20 >&2
  rm -f "$OUT"
  exit 1
fi
rm -f "$OUT"

# Post-install hardening (docs: remove install dir, lock config, cron every 5 min).
rm -rf "$FB_DIR/install"
chown www-data:www-data "$FB_DIR/config.php"
chmod 440 "$FB_DIR/config.php"
echo "*/5 * * * * www-data /usr/bin/php ${FB_DIR}/cron.php > /dev/null 2>&1" > /etc/cron.d/fossbilling
chmod 644 /etc/cron.d/fossbilling
sudo -u www-data /usr/bin/php "${FB_DIR}/cron.php" > /dev/null 2>&1 || true

echo "Installed: https://${FB_DOMAIN}/ (admin: /admin). Credentials in ${CRED_FILE}."
