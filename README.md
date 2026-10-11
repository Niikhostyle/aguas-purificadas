# MiBidón (aguas-purificadas)

Plataforma ecommerce multi-tenant para agua purificada en Chile.

- Landing comercial: `mibidon.cl`
- Tenants: `slug.mibidon.cl`
- Demo pública: `demo.mibidon.cl` (marca **Demo**)

Storefront inspirado en experiencias tipo Manantial (hogar/empresa, región, carrusel, módulos activables).

## Arranque local

```bash
docker compose up -d
cp .env.example .env
# Definí secretos fuertes + SEED_* en .env (ver .env.example)
npm install
npx prisma migrate deploy
npm run db:seed
npm run dev          # http://127.0.0.1:43123/?tenant=demo
```

El seed **no** incluye contraseñas por defecto. Requiere variables `SEED_SUPER_ADMIN_*` y `SEED_DEMO_ADMIN_*`.

## Producción

1. Desplegar con `docker-compose.prod.yml` (ver `deploy/`).
2. Migraciones: `prisma migrate deploy`.
3. Bootstrap seguro (una vez): `npx tsx scripts/secure-prod-bootstrap.ts` con env en el servidor:
   - `SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD`
   - `DEMO_ADMIN_EMAIL` / `DEMO_ADMIN_PASSWORD` (si `KEEP_DEMO_TENANT=1`)
4. `RUN_SEED` debe estar en `false` en producción para no re-sembrar.

## Admin

| Rol | Entrada |
|-----|---------|
| Demo pública (sin credenciales) | `demo.mibidon.cl/admin` o `/admin/demo-access` |
| Super-admin plataforma | `/admin/login` (modo plataforma, sin slug) |
| Admin empresa | `/admin/login` con slug del tenant |

Módulos storefront (admin empresa → **Módulos**): `descuentos`, `planes`, `kits`, `redes`, `certificaciones`, `loginClientes`, `selectorRegion`, `hogarEmpresa`. Banners del hero: **Marca**.

## Seguridad

- Secretos solo en `.env` del servidor (gitignored).
- Cookies de sesión `httpOnly` + `secure` en producción.
- Rate-limit en login admin/cliente.
- Uploads: tipo/tamaño/magic bytes, sin path traversal.
- WebPay API keys cifradas en DB (`WEBPAY_CREDENTIALS_KEY` / `ADMIN_SESSION_SECRET`).
