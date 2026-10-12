-- Template copy that was seeded/copied into tenants with Argentine voseo; swap the exact phrases for neutral Spanish.
UPDATE "tenants" SET "deliveryBanner" = replace("deliveryBanner", 'Elegí tu ciudad', 'Elige tu ciudad')
WHERE "deliveryBanner" LIKE 'Despacho a comunas seleccionadas. Elegí tu ciudad%';

UPDATE "tenants" SET "heroBody" = 'Pide online, activa los módulos que necesites desde el admin y cobra con WebPay.'
WHERE "heroBody" = 'Pedí online, activá los módulos que necesites desde el admin y cobrá con WebPay.';

UPDATE "tenants" SET "heroBody" = 'Pide online, personaliza módulos desde el admin y cobra con WebPay.'
WHERE "heroBody" = 'Pedí online, personalizá módulos desde el admin y cobrá con WebPay.';

UPDATE "tenants" SET "heroBody" = 'Purificación multietapas, libre de sodio. Pide online, elige tu ciudad y recibe en ruta.'
WHERE "heroBody" = 'Purificación multietapas, libre de sodio. Pedí online, elegí tu ciudad y recibí en ruta.';

UPDATE "tenants"
SET "modulesContent" = replace(
  replace("modulesContent"::text, 'Pedís cuando necesitás, con precio preferente.', 'Pides cuando lo necesitas, con precio preferente.'),
  'Pedí online y recibí en tu comuna.', 'Pide online y recibe en tu comuna.'
)::jsonb
WHERE "modulesContent"::text LIKE '%Pedís cuando necesitás%' OR "modulesContent"::text LIKE '%Pedí online y recibí en tu comuna%';
