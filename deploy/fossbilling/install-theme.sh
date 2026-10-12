#!/usr/bin/env bash
# Installs / updates the "mibidon" client-area theme for FOSSBilling and activates it.
# The theme is Huraga's compiled assets + the overrides in deploy/fossbilling/themes/mibidon,
# so FOSSBilling upgrades (which replace themes/huraga) don't wipe it.
# Idempotent. Run as root on the VPS from the repo checkout:
#   bash deploy/fossbilling/install-theme.sh             # install / update + activate
#   bash deploy/fossbilling/install-theme.sh --rollback  # switch back to huraga
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FB_DIR="${FB_DIR:-/var/www/fossbilling}"
DB_NAME="${DB_NAME:-fossbilling}"
THEME="mibidon"
BASE_THEME="huraga"
SRC="$SCRIPT_DIR/themes/$THEME"
DEST="$FB_DIR/themes/$THEME"

set_theme() {
  local exists
  exists="$(mariadb -N "$DB_NAME" -e "SELECT COUNT(*) FROM setting WHERE param='theme'")"
  if [ "$exists" = "0" ]; then
    mariadb "$DB_NAME" -e "INSERT INTO setting (param, value, public, created_at, updated_at) VALUES ('theme', '$1', 0, NOW(), NOW())"
  else
    mariadb "$DB_NAME" -e "UPDATE setting SET value='$1', updated_at=NOW() WHERE param='theme'"
  fi
}

clear_cache() {
  find "$FB_DIR/data/cache" -mindepth 1 -maxdepth 1 ! -name '.*' ! -name 'index.html' -exec rm -rf {} +
}

if [ "${1:-}" = "--rollback" ]; then
  set_theme "$BASE_THEME"
  clear_cache
  echo "Client theme switched back to $BASE_THEME (themes/$THEME left in place)."
  exit 0
fi

[ -d "$FB_DIR/themes/$BASE_THEME/assets/build" ] || { echo "Base theme $BASE_THEME not found in $FB_DIR/themes" >&2; exit 1; }
[ -f "$SRC/manifest.json" ] || { echo "Theme source not found: $SRC" >&2; exit 1; }

TS="$(date +%Y%m%d-%H%M%S)"
BACKUP="/root/backups/fossbilling-theme-$TS"
echo "== 1/4 Backup -> $BACKUP"
mkdir -p "$BACKUP"
tar czf "$BACKUP/themes.tgz" -C "$FB_DIR" themes
mariadb-dump "$DB_NAME" setting > "$BACKUP/setting.sql"

echo "== 2/4 Build themes/$THEME from $BASE_THEME + overrides"
STAGE="$(mktemp -d "$FB_DIR/themes/.${THEME}.XXXXXX")"
cp -a "$FB_DIR/themes/$BASE_THEME/." "$STAGE/"
if [ -f "$DEST/config/settings_data.json" ]; then
  cp -a "$DEST/config/settings_data.json" "$STAGE/config/settings_data.json"
fi
cp -a "$SRC/." "$STAGE/"
sed -i "s#/themes/$BASE_THEME/#/themes/$THEME/#g" "$STAGE/assets/build/manifest.json"

# Theme presets: hide FOSSBilling demo content and widgets that this business doesn't use.
STAGE="$STAGE" php -r '
$f = getenv("STAGE") . "/config/settings_data.json";
$d = json_decode((string) @file_get_contents($f), true) ?: ["presets" => ["Default" => []], "current" => "Default"];
$cur = $d["current"] ?? "Default";
$p = $d["presets"][$cur] ?? [];
foreach ([
    "theme" => "light",
    "showcase_enabled" => "0",
    "footer_to_top_enabled" => "0",
    "hide_dashboard_breadcrumb" => "1",
    "login_page_show_logo" => "1",
    "show_company_logo" => "1",
    "side_menu_news" => "0",
    "side_menu_kb" => "0",
    "side_menu_emails" => "0",
] as $k => $v) { $p[$k] = $v; }
$d["presets"][$cur] = $p;
$d["current"] = $cur;
file_put_contents($f, json_encode($d, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
'

chown -R www-data:www-data "$STAGE"
find "$STAGE" -type d -exec chmod 755 {} +
find "$STAGE" -type f -exec chmod 644 {} +
rm -rf "$DEST.old"
[ -d "$DEST" ] && mv "$DEST" "$DEST.old"
mv "$STAGE" "$DEST"
rm -rf "$DEST.old"

echo "== 3/4 Activate theme"
set_theme "$THEME"

echo "== 4/4 Clear cache"
clear_cache

echo "Done. Rollback: bash $SCRIPT_DIR/install-theme.sh --rollback   (backup: $BACKUP)"
