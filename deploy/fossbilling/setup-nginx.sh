#!/usr/bin/env bash
# Installs the FOSSBilling nginx vhost without touching the mibidon/veotv vhosts.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
STAMP="$(date +%Y%m%d-%H%M%S)"

tar czf "/root/nginx-backup-${STAMP}.tgz" -C /etc nginx
install -m 644 "$HERE/nginx-fossbilling.conf" /etc/nginx/sites-available/fossbilling
ln -sfn /etc/nginx/sites-available/fossbilling /etc/nginx/sites-enabled/fossbilling

if nginx -t; then
  systemctl reload nginx
  echo "nginx reloaded (backup: /root/nginx-backup-${STAMP}.tgz)"
else
  rm -f /etc/nginx/sites-enabled/fossbilling
  echo "nginx -t failed; vhost disabled, nothing reloaded" >&2
  exit 1
fi
