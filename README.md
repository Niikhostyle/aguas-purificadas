# Aguas Purificadas

Plataforma ecommerce white-label para empresas de agua purificada. Cada empresa es un **tenant** con tienda, catálogo, carrito, WebPay y panel admin.

Entrega actual: **Fases 1–3** (fundaciones, carrito/checkout, WebPay Plus sandbox + mock).

## Stack

- Next.js (App Router) + TypeScript + Tailwind + shadcn/ui
- PostgreSQL + Prisma
- Carrito cookie HTTP-only (`aguas_cart`)
- Transbank WebPay Plus REST (`transbank-sdk`) por tenant

## Arranque local

```bash
docker compose up -d   # o Postgres local
cp .env.example .env
npm install
npx prisma migrate dev
npm run db:seed
npm run dev            # http://127.0.0.1:43123
```

## Variables de entorno

| Variable | Descripción |
|----------|-------------|
| `DATABASE_URL` | Postgres |
| `DEFAULT_TENANT_SLUG` | `rio-claro` en local |
| `ADMIN_SESSION_SECRET` | Sesión admin |
| `APP_URL` | Base pública para `return_url` WebPay (`http://127.0.0.1:43123`) |
| `WEBPAY_MODE` | `auto` (default) · `sandbox` · `mock` |
| `WEBPAY_CREDENTIALS_KEY` | Material AES para cifrar API keys en DB |
| `WEBPAY_COMMERCE_CODE` / `WEBPAY_API_KEY` | Override opcional (si no, usa credenciales del tenant o defaults del SDK) |

### Modos WebPay

- **`auto` / `sandbox`:** crea transacción real en ambiente Integration de Transbank. Credenciales: DB del tenant (seed) → env → defaults del SDK.
- **`mock`:** no llama a Transbank; tras el checkout vas a `/pago/mock/[orderId]` y simulás aprobado / rechazado / anulado.

Si `create` de sandbox falla (red, etc.), hay fallback automático a mock.

## Tenant demo

| Campo | Valor |
|-------|--------|
| Slug | `rio-claro` |
| Admin | `admin@rio-claro.demo` / `admin123` |
| WebPay commerce (sandbox) | `597055555532` (`IntegrationCommerceCodes.WEBPAY_PLUS`) |
| WebPay API key | la de integración del SDK (`IntegrationApiKeys.WEBPAY`), cifrada en DB |

## Probar pago end-to-end

### A) Mock (sin Transbank)

```bash
# en .env
WEBPAY_MODE=mock
```

1. Reiniciá `npm run dev`
2. [http://127.0.0.1:43123/productos](http://127.0.0.1:43123/productos) → agregar al carrito → checkout → **Pagar con WebPay**
3. En `/pago/mock/...` elegí **Simular pago aprobado**
4. Confirmación `/pedido/[id]` con estado `paid`
5. Admin → Pedidos → ver auth `MOCK-AUTH`

### B) Sandbox real Transbank

```bash
WEBPAY_MODE=sandbox   # o auto
APP_URL=http://127.0.0.1:43123
```

1. Mismo flujo hasta **Pagar con WebPay** → redirección a `webpay3gint.transbank.cl`
2. Usá tarjeta de prueba (abajo)
3. Return a `/pago/retorno` → commit idempotente → `/pedido/[id]`
4. Admin muestra `AUTHORIZED`, código de autorización, etc.

#### Tarjetas de prueba (Integración WebPay Plus)

| Resultado | Número | CVV | Fecha |
|-----------|--------|-----|-------|
| Aprobada | `4051885600446623` | `123` | cualquier futura |
| Rechazada | `5180350659385122` | `123` | cualquier futura |

En el formulario de autenticación del banco de prueba, RUT y clave suelen ser genéricos de integración (p. ej. RUT `11.111.111-1` / clave `123`). Si Transbank cambia el flujo del simulador, seguí las indicaciones en pantalla.

Documentación oficial: [Transbank Developers — WebPay Plus](https://www.transbankdevelopers.cl/documento/webpay).

## Flujo técnico

1. Checkout crea `Order` `pending` y vacía el carrito  
2. `create` WebPay → `token` + `url` (o mock)  
3. Return `/pago/retorno` con `token_ws` (o `TBK_TOKEN` si anula)  
4. `commit` (si ya estaba committed → `status`) → `paid` / `failed` / `cancelled`  
5. Admin lista estado de pago

## Rutas

| Ruta | Uso |
|------|-----|
| `/carrito` `/checkout` | Carrito y datos |
| `/pago/retorno` | Return URL Transbank |
| `/pago/mock/[orderId]` | Simulador local |
| `/pedido/[id]` | Confirmación + reintentar pago |
| `/admin/pedidos` | Pedidos y estado WebPay |

## Scripts

```bash
npm run dev          # puerto 43123
npm run db:migrate
npm run db:seed
npm run build
```
