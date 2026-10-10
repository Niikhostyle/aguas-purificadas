# Aguas Purificadas

Plataforma ecommerce white-label para empresas de agua purificada (bidones, packs, despacho). Cada empresa es un **tenant** con su propia tienda, catálogo, branding y panel admin.

Entrega actual: **Fase 1 + Fase 2** (fundaciones, catálogo, carrito, checkout → pedido `pending`). Sin WebPay aún (Fase 3).

## Stack

- Next.js (App Router) + TypeScript + Tailwind + shadcn/ui
- PostgreSQL + Prisma
- Carrito en cookie HTTP-only (`aguas_cart`)
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

Productos con precios CLP y zonas: Talca centro (gratis), Gran Talca ($1.500), Curicó y Linares ($2.500).

## Probar carrito → pedido

1. Abrí [http://127.0.0.1:43123/productos](http://127.0.0.1:43123/productos)
2. Entrá a un producto → **Agregar al carrito**
3. En `/carrito` ajustá cantidades o quitá ítems
4. **Ir al checkout** → nombre, teléfono, dirección y zona de despacho
5. **Confirmar pedido** → pantalla `/pedido/[id]` con total CLP (estado `pending`)
6. Admin: [http://127.0.0.1:43123/admin/login](http://127.0.0.1:43123/admin/login) → **Pedidos**

## Cómo se resuelve el tenant (local)

Orden en `src/middleware.ts`:

1. **Subdominio** — `rio-claro.localhost:43123`
2. **Query** — `?tenant=rio-claro` (cookie `aguas_tenant`)
3. **Header** — `x-tenant: rio-claro`
4. **Cookie** — `aguas_tenant`
5. **Env** — `DEFAULT_TENANT_SLUG` (default: `rio-claro`)

Sin tenant resuelto → 404.

## Rutas útiles

| Ruta | Descripción |
|------|-------------|
| `/` | Home storefront |
| `/productos` | Catálogo |
| `/productos/[slug]` | Ficha + agregar al carrito |
| `/carrito` | Carrito (cookie) |
| `/checkout` | Datos + zona → Order pending |
| `/pedido/[id]` | Confirmación |
| `/admin/login` | Login admin |
| `/admin/productos` | CRUD productos |
| `/admin/pedidos` | Listado de pedidos |

## Fuera de alcance (próxima fase)

WebPay Plus sandbox, cambio de estado de pago, onboarding multi-tenant UI, deploy producción.

## Scripts

```bash
npm run dev          # Next en puerto 43123
npm run db:migrate   # prisma migrate dev
npm run db:seed      # tenant + productos + admin
npm run db:studio    # Prisma Studio
npm run build        # build producción
```
