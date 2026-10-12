#!/usr/bin/env bash
# Installs / updates the MiBidón FOSSBilling module and wires it to the Next platform.
# Idempotent. Run as root on the VPS from the repo checkout:
#   bash deploy/fossbilling/install-mibidon-module.sh
# Reads PLATFORM_PROVISION_SECRET and APP_HOST_PORT from /var/www/mibidon/.env (override via env).
# Uses a short-lived admin API token (admin id 1) and restores the previous token on exit.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FB_DIR="${FB_DIR:-/var/www/fossbilling}"
FB_DOMAIN="${FB_DOMAIN:-billing.mibidon.cl}"
DB_NAME="${DB_NAME:-fossbilling}"
MIBIDON_ENV="${MIBIDON_ENV:-/var/www/mibidon/.env}"
PRODUCT_SLUG="${PRODUCT_SLUG:-plan-mibidon}"
FORM_NAME="${FORM_NAME:-Datos de tu tienda MiBidón}"

read_env() { grep -E "^$1=" "$MIBIDON_ENV" 2>/dev/null | tail -1 | cut -d= -f2- | sed -E 's/^"(.*)"$/\1/'; }

export SECRET="${PLATFORM_PROVISION_SECRET:-$(read_env PLATFORM_PROVISION_SECRET)}"
APP_PORT="${APP_HOST_PORT:-$(read_env APP_HOST_PORT)}"
export ENDPOINT="${MIBIDON_PROVISION_URL:-http://127.0.0.1:${APP_PORT:-3001}/api/platform/provision}"
export PRODUCT_SLUG FORM_NAME

if [ "${#SECRET}" -lt 32 ]; then
  echo "PLATFORM_PROVISION_SECRET (>= 32 chars) missing. Add it to $MIBIDON_ENV and redeploy Next first." >&2
  exit 1
fi

echo "== 1/6 Lint + copy module"
for f in "$SCRIPT_DIR"/modules/Mibidon/Service.php "$SCRIPT_DIR"/modules/Mibidon/Api/*.php; do
  php -l "$f" > /dev/null
done
STAGE="$(mktemp -d)"
cp -r "$SCRIPT_DIR/modules/Mibidon" "$STAGE/Mibidon"
rm -rf "$STAGE/Mibidon/tests"
chown -R www-data:www-data "$STAGE/Mibidon"
find "$STAGE/Mibidon" -type d -exec chmod 755 {} +
find "$STAGE/Mibidon" -type f -exec chmod 644 {} +
rm -rf "$FB_DIR/modules/Mibidon"
mv "$STAGE/Mibidon" "$FB_DIR/modules/Mibidon"
rmdir "$STAGE"

OLD_TOKEN="$(mariadb -N "$DB_NAME" -e "SELECT IFNULL(api_token,'') FROM admin WHERE id=1")"
TOKEN="$(openssl rand -hex 24)"
mariadb "$DB_NAME" -e "UPDATE admin SET api_token='${TOKEN}' WHERE id=1"
cleanup() {
  if [ -n "$OLD_TOKEN" ]; then
    mariadb "$DB_NAME" -e "UPDATE admin SET api_token='${OLD_TOKEN}' WHERE id=1"
  else
    mariadb "$DB_NAME" -e "UPDATE admin SET api_token=NULL WHERE id=1"
  fi
}
trap cleanup EXIT

# api <path> <json> [allow]  -> prints the "result" as JSON; exits on API error unless "allow"
api() {
  local res err
  res="$(curl -sk --resolve "${FB_DOMAIN}:443:127.0.0.1" -u "admin:${TOKEN}" \
    -H 'Content-Type: application/json' -d "$2" "https://${FB_DOMAIN}/api/admin/$1")"
  err="$(printf '%s' "$res" | php -r '$d = json_decode(stream_get_contents(STDIN), true);
    if (!is_array($d)) { echo "invalid response"; } elseif (!empty($d["error"])) { echo $d["error"]["message"] ?? "error"; }')"
  if [ -n "$err" ]; then
    if [ "${3:-}" = "allow" ]; then
      echo "   ($1: $err)" >&2
      return 0
    fi
    echo "API $1 failed: $err" >&2
    exit 1
  fi
  printf '%s' "$res" | php -r 'echo json_encode(json_decode(stream_get_contents(STDIN), true)["result"]);'
}

echo "== 2/6 Activate extension"
api extension/activate '{"type":"mod","id":"mibidon"}' allow > /dev/null

echo "== 3/6 Module settings (endpoint ${ENDPOINT})"
CONFIG_JSON="$(php -r 'echo json_encode([
  "ext" => "mod_mibidon",
  "endpoint_url" => getenv("ENDPOINT"),
  "secret" => getenv("SECRET"),
  "product_slugs" => getenv("PRODUCT_SLUG"),
  "company_field" => "empresa",
  "slug_field" => "subdominio",
  "notify_email" => "1",
]);')"
api extension/config_save "$CONFIG_JSON" > /dev/null

echo "== 4/6 Order form fields"
PRODUCT_ID="$(mariadb -N "$DB_NAME" -e "SELECT id FROM product WHERE slug='${PRODUCT_SLUG}' LIMIT 1")"
[ -n "$PRODUCT_ID" ] || { echo "Product ${PRODUCT_SLUG} not found" >&2; exit 1; }
FORM_ID="$(mariadb -N "$DB_NAME" -e "SELECT IFNULL(form_id,'') FROM product WHERE id=${PRODUCT_ID}")"
if [ -z "$FORM_ID" ]; then
  FORM_ID="$(mariadb -N "$DB_NAME" -e "SELECT id FROM form WHERE name='${FORM_NAME}' ORDER BY id LIMIT 1")"
fi
if [ -z "$FORM_ID" ]; then
  FORM_ID="$(api formbuilder/create_form "$(php -r 'echo json_encode(["name" => getenv("FORM_NAME"), "type" => "horizontal"]);')")"
fi
add_field() { # name json
  local exists
  exists="$(mariadb -N "$DB_NAME" -e "SELECT COUNT(*) FROM form_field WHERE form_id=${FORM_ID} AND name='$1'")"
  if [ "$exists" = "0" ]; then
    api formbuilder/add_field "$2" > /dev/null
    echo "   + field $1"
  else
    echo "   = field $1 (exists)"
  fi
}
add_field empresa "{\"form_id\":${FORM_ID},\"type\":\"text\",\"name\":\"empresa\",\"label\":\"Nombre de la empresa\",\"required\":1,\"description\":\"Así aparecerá en tu tienda online.\"}"
add_field subdominio "{\"form_id\":${FORM_ID},\"type\":\"text\",\"name\":\"subdominio\",\"label\":\"Subdominio deseado\",\"required\":1,\"description\":\"Solo letras, números y guiones. Ej.: aguaspuras = aguaspuras.mibidon.cl\"}"

echo "== 5/6 Attach form ${FORM_ID} to product ${PRODUCT_ID}"
api product/update "{\"id\":${PRODUCT_ID},\"form_id\":${FORM_ID}}" > /dev/null

echo "== 6/6 Test connection to the platform"
api mibidon/test_connection '{}'
echo
echo "Done. FOSSBilling cron (/etc/cron.d/fossbilling) also reconciles stores hourly."
