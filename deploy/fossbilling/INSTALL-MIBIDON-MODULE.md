# Módulo FOSSBilling «MiBidón tiendas» — billing ↔ tiendas automáticas

Une https://billing.mibidon.cl (FOSSBilling 0.8.8) con las tiendas `<slug>.mibidon.cl` (Next):
el cliente contrata y paga el plan en billing y su tienda se crea, suspende, reactiva o da de baja sola.

## Flujo

```
mibidon.cl  ──CTA plan──▶  billing.mibidon.cl/order/plan-mibidon
                            │  formulario del producto: «Nombre de la empresa» + «Subdominio deseado»
                            │  al agregar al carrito: el módulo valida el subdominio contra Next (action=check)
                            ▼
                     factura pagada → orden activada (setup after_payment)
                            │  hook onAfterAdminOrderActivate
                            ▼
   POST http://127.0.0.1:3001/api/platform/provision   (HMAC-SHA256, x-mibidon-timestamp/-signature)
                            │  crea tenant + admin (contraseña aleatoria inutilizable) + invitación 7 días
                            ▼
   respuesta: URL tienda, URL panel, enlace /admin/activar?token=…
     → nota en el historial de la orden (sin token)
     → correo «mod_mibidon_provisioned» al cliente (queda en cola hasta que haya SMTP)
     → área de cliente (Servicios → la orden): URL de la tienda + botón «Crear o restablecer contraseña»
```

| Evento FOSSBilling | Acción en Next |
|---|---|
| `onAfterAdminOrderActivate` | `create` (idempotente por ID de orden) |
| `onAfterAdminOrderSuspend` (impago, manual) | `suspend` → tienda y panel muestran «Cuenta suspendida» |
| `onAfterAdminOrderUnsuspend` / `onAfterAdminOrderUncancel` | `unsuspend` (si la tienda nunca se creó, la crea) |
| `onAfterAdminOrderRenew` | `renew` (solo marca fecha) |
| `onAfterAdminOrderCancel` / `onBeforeAdminOrderDelete` | `cancel` → «Tienda no disponible» (los datos se conservan) |
| `onAfterAdminBatchSuspendOrders`, `…BatchCancel…` (cron, no disparan eventos por orden) | reconciliación completa |
| `onAfterAdminCronRun` (cada 5 min, efectivo 1 vez/hora) | reconciliación completa (`sync`) |
| `onBeforeProductAddedToCart` | `check` del subdominio (bloquea el carrito si está tomado/reservado) |

Los fallos de red nunca rompen el flujo de FOSSBilling: se registran (log de actividad + `error_log` de php-fpm + nota en la orden) y la reconciliación horaria los reintenta.

## Contrato del endpoint (`src/app/api/platform/provision/route.ts`)

- `POST`, `Content-Type: application/json`, cuerpo ≤ 16 KB.
- `x-mibidon-timestamp`: segundos Unix; se rechaza con desfase > 5 min.
- `x-mibidon-signature`: `hex(HMAC_SHA256(PLATFORM_PROVISION_SECRET, "<timestamp>.<cuerpo crudo>"))` (acepta prefijo `sha256=`), comparación en tiempo constante.
- Solo responde en el host de la plataforma (apex / IP / `127.0.0.1`); en `<slug>.mibidon.cl` o con `?tenant=` → 404. Sin secreto configurado → 503.
- Acciones: `check {slug}`, `create {orderId, clientId, companyName, slug, ownerName, ownerEmail, ownerPhone?, plan?}`, `sync {…create, status: active|suspended|canceled}`, `suspend|unsuspend|cancel|renew|invite {orderId}`.
- Errores de subdominio: `409 slug_taken`, `422 slug_reserved|slug_invalid` con `message` en español (el módulo lo muestra en la orden).

## Despliegue (coordinador)

Orden importante: primero Next (endpoint + migración), después el módulo.

1. **Secreto compartido** (una vez), en el VPS:
   ```bash
   echo "PLATFORM_PROVISION_SECRET=\"$(openssl rand -hex 32)\"" >> /var/www/mibidon/.env
   ```
   Opcional (solo para `scripts/billing-reconcile.ts`): `FOSSBILLING_API_URL`, `FOSSBILLING_API_KEY`.
2. **Next**: mergear `cursor/billing-provisioning`, construir la imagen y desplegar con `deploy-mibidon.sh` como siempre. El entrypoint aplica la migración `20261011233000_tenant_billing_admin_invites` (columnas `billing*`/`plan` en `tenants` + tabla `admin_invites`; solo aditiva).
   Comprobar: `curl -s -XPOST http://127.0.0.1:3001/api/platform/provision` → `401 {"error":"bad_timestamp"}` (si da 503 falta el secreto).
3. **CTA de la landing** (el valor del CMS en BD pisa el default del código). Antes o durante el deploy:
   ```bash
   cd /var/www/mibidon && docker compose -f docker-compose.prod.yml exec -T db psql -U mibidon -d mibidon -c "UPDATE platform_landing_sections SET content = jsonb_set(content, '{plans}', (SELECT jsonb_agg(CASE WHEN COALESCE(p->>'ctaUrl','') = '' THEN p || '{\"ctaUrl\":\"https://billing.mibidon.cl/order/plan-mibidon\"}'::jsonb ELSE p END) FROM jsonb_array_elements(content->'plans') p)), \"updatedAt\" = now() WHERE key = 'pricing';"
   ```
   Alternativa sin SQL: super-admin → `/admin/plataforma/landing/pricing` → «URL del botón» = `https://billing.mibidon.cl/order/plan-mibidon` → Guardar (invalida la caché al instante; el SQL se ve tras el redeploy o en ≤ 1 h).
4. **Módulo FOSSBilling** (como root, desde el checkout actualizado):
   ```bash
   cd /var/www/mibidon && bash deploy/fossbilling/install-mibidon-module.sh
   ```
   Idempotente: lint PHP, copia `modules/Mibidon` (sin `tests/`) a `/var/www/fossbilling/modules/Mibidon` (`www-data`, 644/755), activa la extensión, guarda ajustes (endpoint `http://127.0.0.1:${APP_HOST_PORT}/api/platform/provision` + secreto leído de `/var/www/mibidon/.env`), crea el formulario «Datos de tu tienda MiBidón» con los campos `empresa` y `subdominio` (obligatorios), lo asocia al producto `plan-mibidon` y prueba la conexión. Usa un token API temporal del admin id 1 y restaura el anterior al salir.
5. **Prueba en producción** (sin pasarela): admin FOSSBilling → Clientes → cliente de prueba → Nueva orden «Plan MiBidón Tienda Online» con empresa/subdominio → Activar. Ver la nota «Tienda MiBidón creada: …» en la orden y la tienda en `https://<subdominio>.mibidon.cl`. Luego Suspender / Reactivar / Cancelar y comprobar `https://<subdominio>.mibidon.cl`.
   La orden #1 existente (activa, sin campos de formulario) se creará en la primera reconciliación usando la empresa o el nombre del cliente como subdominio: si no se quiere, cancelarla antes de instalar el módulo.

### Pasos manuales equivalentes (si no se usa el script)

1. Copiar `deploy/fossbilling/modules/Mibidon` → `/var/www/fossbilling/modules/Mibidon` (`chown -R www-data:www-data`).
2. Admin → Extensiones → «MiBidón tiendas» → Activar → Configuración: URL del endpoint, secreto, slugs `plan-mibidon`, campos `empresa` / `subdominio`.
3. Admin → Configuración → Formularios → nuevo formulario con dos campos de texto obligatorios: nombre `empresa` (etiqueta «Nombre de la empresa») y nombre `subdominio` (etiqueta «Subdominio deseado»).
4. Productos → Plan MiBidón Tienda Online → Configuración → Formulario = el anterior.
5. «Probar conexión» en la página de ajustes del módulo.

## Operación

- **Subdominio ya tomado al activar** (dos compras simultáneas con el mismo nombre): la orden queda activa sin tienda y con la nota «No se pudo crear la tienda…». Corregir el campo `subdominio` en la configuración de la orden (admin → orden → Configuración) y pulsar «Sincronizar» en Extensiones → MiBidón tiendas (o esperar la reconciliación horaria).
- **El cliente perdió el enlace**: él mismo, en billing → Servicios → la orden → «Crear o restablecer contraseña del panel» (genera un enlace nuevo de 7 días y lo lleva directo). El staff puede hacer lo mismo llamando `invite`.
- **Logs**: FOSSBilling → Actividad (mensajes `[mibidon] …`) y `/var/log/php8.3-fpm.log`; Next → `docker logs mibidon-app-1 | grep '\[provision\]'`.
- **Reconciliación externa** (opcional, además de la del módulo): en el VPS (Node 22)
  ```bash
  cd /var/www/mibidon && set -a && . ./.env && set +a && \
    FOSSBILLING_API_KEY=… PLATFORM_PROVISION_URL=http://127.0.0.1:3001/api/platform/provision \
    node --experimental-strip-types scripts/billing-reconcile.ts [--dry-run]
  ```
  Requiere una API key de staff (Perfil → API key). Cron sugerido: `17 * * * *`.
- **Suspendidas / canceladas en Next**: `Tenant.active=false` + `billingStatus`. El super-admin las ve en `/admin/plataforma/empresas?estado=suspendidas`. Los datos nunca se borran automáticamente.
- php-fpm tiene `clear_env` por defecto, así que el módulo lee la configuración de sus ajustes (las variables `MIBIDON_PROVISION_URL/SECRET` son solo un fallback).

## Prueba local del módulo (sin FOSSBilling)

Con `next dev` corriendo y `PLATFORM_PROVISION_SECRET` en `.env`:

```bash
npx tsx scripts/test-provisioning.ts             # endpoint + activación + login (Chrome local)
docker run --rm -v "$PWD/deploy/fossbilling/modules/Mibidon:/m" \
  -e MIBIDON_TEST_URL=http://host.docker.internal:43125/api/platform/provision \
  -e MIBIDON_TEST_HOST=localhost:43125 -e MIBIDON_PROVISION_SECRET=… \
  php:8.3-cli php /m/tests/harness.php          # Service.php real con DI simulado (SQLite)
```

## Pendiente del dueño

- **Pasarela de pago** para FOSSBilling (Flow, Mercado Pago o WebPay no vienen en 0.8.8; hoy solo transferencia manual / PayPal / Stripe). Sin pasarela, el staff marca la factura como pagada y la activación es automática desde ahí.
- **SMTP** (proveedor + credenciales) en FOSSBilling → Configuración → Correo. Mientras tanto el correo de bienvenida queda en cola y el cliente ve su tienda y el botón de acceso en el área de cliente.
