# Aguas Purificadas

Plataforma ecommerce white-label para empresas de agua purificada (bidones, packs, despacho). Cada empresa es un **tenant** con su propia tienda, catálogo, branding y panel admin.

Esta entrega es la **Fase 1**: fundaciones + primer tenant demo (sin carrito ni WebPay).

## Stack

- Next.js (App Router) + TypeScript + Tailwind + shadcn/ui
- PostgreSQL + Prisma
- Resolución de tenant por subdominio, query, header o default de entorno

## Requisitos

- Node.js 20+
- PostgreSQL 16 (local o Docker)

## Arranque local

### 1. Base de datos

Con Docker (recomendado):

```bash
docker compose up -d
```

Sin Docker, creá una DB compatible con la URL del `.env.example`.

### 2. Variables de entorno

```bash
cp .env.example .env
```

Valores por defecto:

| Variable | Valor demo |
|----------|------------|
| `DATABASE_URL` | `postgresql://aguas:aguas_dev@localhost:5432/aguas_purificadas?schema=public` |
| `DEFAULT_TENANT_SLUG` | `rio-claro` |
| `ADMIN_SESSION_SECRET` | secreto de sesión local |

### 3. Migraciones, seed y app

```bash
npm install
npx prisma migrate dev
npm run db:seed
npm run dev
```

La app queda en **[http://127.0.0.1:43123](http://127.0.0.1:43123)**.

## Tenant demo

| Campo | Valor |
|-------|--------|
| Slug | `rio-claro` |
| Nombre | Aguas Río Claro |
| Admin | `admin@rio-claro.demo` |
| Contraseña | `admin123` |

Productos seed con precios CLP, zonas de despacho stub (Talca / Gran Talca / Curicó-Linares) y datos de contacto.

## Cómo se resuelve el tenant (local)

Orden en `src/middleware.ts`:

1. **Subdominio** — `rio-claro.localhost:43123`
2. **Query** — `?tenant=rio-claro` (se guarda en cookie `aguas_tenant`)
3. **Header** — `x-tenant: rio-claro`
4. **Cookie** — `aguas_tenant`
5. **Env** — `DEFAULT_TENANT_SLUG` (default local: `rio-claro`)

Para el demo local usamos el default de entorno: abrís `http://127.0.0.1:43123` y ya carga Río Claro. Para forzar otro tenant: `http://127.0.0.1:43123/?tenant=otro-slug`.

Sin tenant resuelto → 404 (sin leak de datos).

## Rutas útiles

| Ruta | Descripción |
|------|-------------|
| `/` | Home storefront del tenant |
| `/productos` | Listado de productos |
| `/productos/[slug]` | Ficha de producto |
| `/admin/login` | Login admin empresa |
| `/admin` | Resumen |
| `/admin/productos` | CRUD básico de productos |

## Fuera de alcance (Fase 1)

Carrito, checkout, WebPay, onboarding multi-tenant UI y deploy a producción. El esquema deja espacio para pedidos/credenciales en fases siguientes.

## Scripts

```bash
npm run dev          # Next en puerto 43123
npm run db:migrate   # prisma migrate dev
npm run db:seed      # tenant + productos + admin
npm run db:studio    # Prisma Studio
npm run build        # build producción
```
