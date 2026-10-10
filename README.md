# Aguas Purificadas

Plataforma ecommerce white-label para empresas de agua purificada. Cada empresa es un **tenant** con tienda, catálogo, carrito, WebPay, branding y panel admin.

Entrega actual: **Fases 1–5** (fundaciones → carrito → WebPay → branding → onboarding multi-empresa).

## Stack

- Next.js (App Router) + TypeScript + Tailwind + shadcn/ui
- PostgreSQL + Prisma
- Carrito cookie HTTP-only (`aguas_cart`)
- Transbank WebPay Plus REST (`transbank-sdk`) por tenant
- Branding por CSS variables desde datos del tenant

## Arranque local

```bash
docker compose up -d   # o Postgres local
cp .env.example .env
npm install
npx prisma migrate dev
npm run db:seed
npm run dev            # http://127.0.0.1:43123
```

## Tenants demo (seed)

| Slug | Rol | Login | Contraseña |
|------|-----|-------|------------|
| `rio-claro` | Admin empresa | `admin@rio-claro.demo` | `admin123` |
| `manantial-andes` | Admin empresa (2º tenant) | `admin@manantial-andes.demo` | `admin123` |
| `plataforma` | Super-admin | `super@plataforma.demo` | `admin123` |

Tiendas:

- [Río Claro](http://127.0.0.1:43123/?tenant=rio-claro) (default local)
- [Manantial Andes](http://127.0.0.1:43123/?tenant=manantial-andes)

## Variables de entorno

| Variable | Descripción |
|----------|-------------|
| `DATABASE_URL` | Postgres |
| `DEFAULT_TENANT_SLUG` | `rio-claro` en local |
| `ADMIN_SESSION_SECRET` | Sesión admin |
| `APP_URL` | Base pública WebPay (`http://127.0.0.1:43123`) |
| `WEBPAY_MODE` | `auto` · `sandbox` · `mock` |
| `WEBPAY_CREDENTIALS_KEY` | AES para API keys en DB |

## Vender a una segunda empresa

Checklist para un vendedor / onboarding asistido (sin tocar código):

1. **Entrar como super-admin**  
   [http://127.0.0.1:43123/admin/login?tenant=plataforma](http://127.0.0.1:43123/admin/login?tenant=plataforma)  
   `super@plataforma.demo` / `admin123`

2. **Nueva empresa** → `/admin/plataforma/nueva`  
   Campos mínimos:
   - Nombre comercial + **slug** (único; se usa en `?tenant=` / subdominio)
   - Colores (#RRGGBB), frase home, quiénes somos, contacto
   - Admin de la empresa (correo + contraseña temporal)
   - Marcar: catálogo demo + WebPay sandbox

3. **Entregar al cliente**
   - URL tienda: `http://127.0.0.1:43123/?tenant=<slug>`
   - Login admin: `/admin/login` con ese slug
   - Pedirle que edite **Marca**, productos y zonas
   - WebPay: en sandbox quedan las credenciales Integration; en producción cargar commerce code + API key propios (cifrados por tenant)

4. **Verificar aislamiento**
   - Admin A solo ve productos/pedidos de A
   - Admin B no ve datos de A
   - Storefronts con `?tenant=` distintos muestran catálogos distintos

5. **Pedido de prueba**  
   Carrito → checkout → WebPay (sandbox o mock) → estado en admin de esa empresa.

## Branding (Fase 4)

Admin empresa → **Marca**: logo URL, colores, contacto, textos. La tienda aplica `--brand` / `--brand-deep` / primary desde esos valores.

## WebPay (resumen)

- Sandbox: `WEBPAY_MODE=sandbox|auto` → Transbank Integration  
- Mock: `WEBPAY_MODE=mock` → `/pago/mock/[orderId]`  
- Tarjeta aprobada: `4051885600446623` / CVV `123`

## Rutas útiles

| Ruta | Uso |
|------|-----|
| `/?tenant=<slug>` | Tienda del tenant |
| `/admin/marca` | Branding empresa |
| `/admin/plataforma` | Super-admin: listado empresas |
| `/admin/plataforma/nueva` | Alta de empresa |
| `/admin/pedidos` | Pedidos + estado WebPay |

## Scripts

```bash
npm run dev          # puerto 43123
npm run db:migrate
npm run db:seed
npm run build
```
