# Aguas Purificadas

Plataforma ecommerce white-label. La plantilla storefront del tenant demo **`rio-claro`** clona módulos de [aguasrioclaro.cl](https://aguasrioclaro.cl/).

Entrega: Fases 1–5 + clon visual + upload de imágenes + super-admin de N empresas.

## Arranque

```bash
docker compose up -d
cp .env.example .env
npm install
npx prisma db push   # o migrate deploy
npm run db:seed
npm run dev          # http://127.0.0.1:43123
```

## Tenants demo

| Slug | Login | Clave |
|------|-------|-------|
| `rio-claro` | `admin@rio-claro.demo` | `admin123` |
| `manantial-andes` | `admin@manantial-andes.demo` | `admin123` |
| `plataforma` (super) | `super@plataforma.demo` | `admin123` |

- Tienda Río Claro: http://127.0.0.1:43123/?tenant=rio-claro  
- Super-admin: http://127.0.0.1:43123/admin/login?tenant=plataforma  

## Crear N sitios (webs) de empresa

1. Login super-admin (`plataforma`).
2. **Empresas → Nueva empresa** (`/admin/plataforma/nueva`): slug, marca, admin dueño, catálogo demo, WebPay sandbox.
3. **Gestionar** cada empresa (`/admin/plataforma/[id]`): editar/suspender, alta de admins, reset de clave.
4. Cada empresa = un tenant = una tienda en `/?tenant=<slug>` (o subdominio).
5. El admin de la empresa carga productos (con imagen), marca y atiende pedidos. No ve datos de otras empresas.

## Imágenes de producto

- En admin **Productos → Nuevo/Editar**: campo archivo → se guarda en `public/uploads/<slug>/…`
- Formatos: JPG/PNG/WEBP/GIF, máx. 5 MB.
- El seed de `rio-claro` usa imágenes bajadas de la referencia en `public/brand/rio-claro/products/`.

## WebPay

`WEBPAY_MODE=auto|sandbox|mock` — ver sección previa; tarjeta sandbox `4051885600446623`.

## Módulos clonados (vs aguasrioclaro.cl)

Ver checklist en el handoff interno / respuesta del agente. Plantilla: top bars despacho/horarios, logo, nav, hero, grilla productos+precios, beneficios (Libre de Sodio…), nosotros, footer teléfonos/cobertura.
