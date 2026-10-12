# FOSSBilling — billing de la plataforma MiBidón

[FOSSBilling](https://fossbilling.org/) oficial (release **0.8.8**, zip de GitHub verificado con SHA-256) instalado en el VPS de MiBidón como admin de billing / SaaS ops.

| | |
|---|---|
| Área de clientes | https://billing.mibidon.cl/ (alias `https://admin.mibidon.cl/`) |
| Admin (staff) | https://billing.mibidon.cl/admin → `/admin/staff/login` |
| Ruta en el VPS | `/var/www/fossbilling` (owner `www-data`) |
| Credenciales | solo en el servidor: `/root/fossbilling-credentials.txt` (chmod 600) |
| Cron | `/etc/cron.d/fossbilling` cada 5 min (`php cron.php` como `www-data`) |

## Qué hace cada sistema

- **FOSSBilling**: billing de la plataforma. Clientes (empresas de agua que contratan MiBidón), suscripciones al *Plan MiBidón Tienda Online* (CLP 34.990/mes), facturas, pagos, recordatorios y tickets de soporte.
- **Next.js (`mibidon-app-1`)**: el producto. Landing `mibidon.cl`, tiendas `*.mibidon.cl` y el admin de cada tenant con la operación de la tienda (despacho, pedidos, productos).

Integración automática: el módulo `modules/Mibidon` crea, suspende, reactiva y da de baja el tenant según la orden del plan (ver [INSTALL-MIBIDON-MODULE.md](INSTALL-MIBIDON-MODULE.md)). El super-admin de Next puede seguir creando tenants a mano.

## Stack en el VPS (Ubuntu 22.04, ~2 GB RAM + 3 GB swap)

- PHP **8.3**-FPM (PPA `ondrej/php`; jammy trae 8.1 y FOSSBilling pide 8.3+). Pool `pm = ondemand`, `max_children = 4`, `memory_limit = 128M`.
- MariaDB **11.4** (repo oficial; FOSSBilling pide 11.4+). Solo `127.0.0.1:3306`, `innodb_buffer_pool_size = 64M`, `performance_schema = OFF`. Base y usuario `fossbilling` con privilegios solo sobre esa base.
- nginx del host: vhost `sites-available/fossbilling` basado en la config NGINX oficial. Los `server_name` exactos ganan al comodín `*.mibidon.cl` del vhost `mibidon`, así que las tiendas siguen yendo a Next. TLS igual que el resto: Cloudflare proxied + cert de origen `*.mibidon.cl` en `/etc/nginx/ssl`.
- Configuración: empresa *MiBidón*, moneda por defecto CLP (`$` y 0 decimales), idioma `es_ES`.

## Scripts (sin secretos; se ejecutan como root en el VPS)

```bash
bash install.sh        # swap si falta, PHP 8.3 + MariaDB 11.4, tuning, BD/usuario, descarga + checksum
bash setup-nginx.sh    # backup de /etc/nginx, instala el vhost, nginx -t y recién ahí reload
bash run-installer.sh  # instalador web vía curl, borra install/, config.php 440, cron
bash basic-setup.sh    # empresa, locale, formato CLP y producto del plan (token API temporal)
bash install-mercadopago.sh  # pasarela Mercado Pago (pide el Access Token sin mostrarlo)
```

Todos son idempotentes. Las contraseñas (BD y admin) se generan en el servidor y solo se escriben en `/root/fossbilling-credentials.txt`.

## Notas de operación

- `config.php` queda en `440`. Los ajustes del admin que escriben el config (idioma, caché) necesitan `chmod u+w` temporal; `basic-setup.sh` lo hace y lo revierte.
- Actualizar: Sistema → Actualizaciones en el admin, o https://docs.fossbilling.org/maintenance/updating/.
- Pagos: adapter propio `gateways/MercadoPago.php` (Checkout Pro, pagos únicos en CLP; cada factura mensual se paga por separado). El pago se confirma consultando la API de Mercado Pago al volver el cliente (`ipn.php?...&redirect=1`) y por webhook (`notification_url` por preferencia, no hace falta configurarlo en el panel de Mercado Pago). Las actualizaciones de FOSSBilling pueden borrar `library/Payment/Adapter/MercadoPago.php`: volver a correr `install-mercadopago.sh` (Enter sin token conserva la configuración).
- Pendiente: SMTP para correos y logo de MiBidón.
