#!/usr/bin/env bash
# MiBidón defaults: company, es_ES locale, CLP formatting and the SaaS plan product.
# Uses a short-lived admin API token that is removed when the script exits.
set -euo pipefail

FB_DIR="${FB_DIR:-/var/www/fossbilling}"
FB_DOMAIN="${FB_DOMAIN:-billing.mibidon.cl}"
DB_NAME="${DB_NAME:-fossbilling}"
PLAN_TITLE="${PLAN_TITLE:-Plan MiBidón Tienda Online}"
PLAN_PRICE="${PLAN_PRICE:-34990}"

TOKEN="$(openssl rand -hex 24)"
mariadb "$DB_NAME" -e "UPDATE admin SET api_token='${TOKEN}' WHERE id=1"
cleanup() {
  mariadb "$DB_NAME" -e "UPDATE admin SET api_token=NULL WHERE id=1"
  chmod 440 "$FB_DIR/config.php"
}
trap cleanup EXIT

api() {
  local path="$1" body="${2:-{\}}"
  local res
  res="$(curl -sk --resolve "${FB_DOMAIN}:443:127.0.0.1" -u "admin:${TOKEN}" \
    -H 'Content-Type: application/json' -d "$body" "https://${FB_DOMAIN}/api/admin/${path}")"
  echo "$path -> $res" | cut -c1-300 >&2
  echo "$res"
}

api system/update_params '{
  "company_name": "MiBidón",
  "company_email": "niikhostyle@gmail.com",
  "company_note": "Plataforma de tiendas online para empresas de agua purificada"
}' > /dev/null

# Locale lives in config.php, which is kept read-only outside this script.
chmod 640 "$FB_DIR/config.php"
chmod u+w "$FB_DIR/config.php"
api system/update_localization_settings '{"locale":"es_ES","auto_detect_locale":false}' > /dev/null

api currency/update '{"code":"CLP","format_pattern":"${amount}","fraction_digits":0}' > /dev/null

EXISTING="$(mariadb -N "$DB_NAME" -e "SELECT id FROM product WHERE title='${PLAN_TITLE}' LIMIT 1")"
if [ -z "$EXISTING" ]; then
  EXISTING="$(api product/prepare "{\"title\":\"${PLAN_TITLE}\",\"type\":\"custom\",\"product_category_id\":1}" \
    | php -r 'echo json_decode(stream_get_contents(STDIN), true)["result"];')"
fi
api product/update "{
  \"id\": ${EXISTING},
  \"title\": \"${PLAN_TITLE}\",
  \"slug\": \"plan-mibidon\",
  \"status\": \"enabled\",
  \"setup\": \"after_payment\",
  \"description\": \"Tienda online multi-tenant para tu empresa de agua purificada: catálogo, pedidos, despacho y panel de administración en tuempresa.mibidon.cl.\",
  \"pricing\": {\"type\": \"recurrent\", \"recurrent\": {
    \"1W\": {\"enabled\": false}, \"3M\": {\"enabled\": false}, \"6M\": {\"enabled\": false},
    \"1Y\": {\"enabled\": false}, \"2Y\": {\"enabled\": false}, \"3Y\": {\"enabled\": false},
    \"1M\": {\"enabled\": true, \"price\": ${PLAN_PRICE}, \"setup\": 0}
  }}
}" > /dev/null

echo "Basic setup done (product id ${EXISTING})."
