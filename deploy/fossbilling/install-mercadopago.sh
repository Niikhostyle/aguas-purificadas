#!/usr/bin/env bash
# Installs / updates the Mercado Pago (Checkout Pro) payment gateway in FOSSBilling.
# Idempotent. Run as root on the VPS from the repo checkout:
#   bash deploy/fossbilling/install-mercadopago.sh
# Asks for the Access Token (input hidden) unless MP_ACCESS_TOKEN is set; leave it
# empty to only install/update the adapter and keep the current gateway settings.
# MP_TEST_MODE=1 stores the token as the test token and enables test mode.
# When Mercado Pago gets enabled, the unconfigured "Custom" gateway is disabled.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FB_DIR="${FB_DIR:-/var/www/fossbilling}"
FB_DOMAIN="${FB_DOMAIN:-billing.mibidon.cl}"
DB_NAME="${DB_NAME:-fossbilling}"
MP_TEST_MODE="${MP_TEST_MODE:-0}"

if [ -z "${MP_ACCESS_TOKEN:-}" ] && [ -t 0 ]; then
  read -rsp "Mercado Pago Access Token (Enter para omitir): " MP_ACCESS_TOKEN
  echo
fi
export MP_ACCESS_TOKEN="${MP_ACCESS_TOKEN:-}" MP_TEST_MODE

echo "== 1/4 Lint + copy adapter"
php -l "$SCRIPT_DIR/gateways/MercadoPago.php" > /dev/null
install -o www-data -g www-data -m 644 "$SCRIPT_DIR/gateways/MercadoPago.php" "$FB_DIR/library/Payment/Adapter/MercadoPago.php"
install -o www-data -g www-data -m 644 "$SCRIPT_DIR/gateways/mercadopago.png" "$FB_DIR/public/gateways/mercadopago.png"

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

# api <path> <json>  -> prints the "result" as JSON; exits on API error
api() {
  local res err
  res="$(curl -sk --resolve "${FB_DOMAIN}:443:127.0.0.1" -u "admin:${TOKEN}" \
    -H 'Content-Type: application/json' -d "$2" "https://${FB_DOMAIN}/api/admin/$1")"
  err="$(printf '%s' "$res" | php -r '$d = json_decode(stream_get_contents(STDIN), true);
    if (!is_array($d)) { echo "invalid response"; } elseif (!empty($d["error"])) { echo $d["error"]["message"] ?? "error"; }')"
  if [ -n "$err" ]; then
    echo "API $1 failed: $err" >&2
    exit 1
  fi
  printf '%s' "$res" | php -r 'echo json_encode(json_decode(stream_get_contents(STDIN), true)["result"]);'
}

echo "== 2/4 Install gateway"
GW_ID="$(mariadb -N "$DB_NAME" -e "SELECT id FROM pay_gateway WHERE gateway='MercadoPago' ORDER BY id LIMIT 1")"
if [ -z "$GW_ID" ]; then
  api invoice/gateway_install '{"code":"MercadoPago"}' > /dev/null
  GW_ID="$(mariadb -N "$DB_NAME" -e "SELECT id FROM pay_gateway WHERE gateway='MercadoPago' ORDER BY id LIMIT 1")"
fi
export GW_ID
echo "   gateway id ${GW_ID}"

echo "== 3/4 Gateway settings"
UPDATE_JSON="$(php -r '
  $d = [
    "id" => (int) getenv("GW_ID"),
    "title" => "Mercado Pago",
    "accepted_currencies" => ["CLP"],
    "allow_single" => 1,
    "allow_recurrent" => 0,
  ];
  $token = trim((string) getenv("MP_ACCESS_TOKEN"));
  if ($token !== "") {
    $test = getenv("MP_TEST_MODE") === "1";
    $d["config"] = [($test ? "test_access_token" : "access_token") => $token, "statement_descriptor" => "MIBIDON"];
    $d["test_mode"] = $test ? 1 : 0;
    $d["enabled"] = 1;
  }
  echo json_encode($d);
')"
api invoice/gateway_update "$UPDATE_JSON" > /dev/null

ENABLED="$(mariadb -N "$DB_NAME" -e "SELECT enabled FROM pay_gateway WHERE id=${GW_ID}")"
if [ "$ENABLED" = "1" ]; then
  echo "== 4/4 Disable unconfigured Custom gateway"
  for id in $(mariadb -N "$DB_NAME" -e "SELECT id FROM pay_gateway WHERE gateway='Custom' AND enabled=1 AND (config IS NULL OR config NOT LIKE '%\"single\":\"_%')"); do
    api invoice/gateway_update "{\"id\":${id},\"enabled\":0}" > /dev/null
    echo "   - Custom gateway ${id} disabled"
  done
  echo "Done. Mercado Pago is live on https://${FB_DOMAIN}/ (test mode: ${MP_TEST_MODE})."
else
  echo "== 4/4 Skipped: Mercado Pago stays disabled until an Access Token is configured"
  echo "   Re-run with the token, or set it in Admin > Configuración > Pasarelas de pago > Mercado Pago."
fi
