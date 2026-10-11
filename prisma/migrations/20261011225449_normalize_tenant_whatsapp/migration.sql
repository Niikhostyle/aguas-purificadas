-- Store Tenant.whatsapp as Chilean digits with country code (e.g. 56912345678).
UPDATE "tenants" AS t
SET "whatsapp" = CASE
  WHEN n.d ~ '^56[0-9]{9}$' THEN n.d
  WHEN n.d ~ '^0056[0-9]{9}$' THEN substring(n.d FROM 3)
  WHEN n.d ~ '^[0-9]{9}$' THEN '56' || n.d
  WHEN n.d ~ '^[0-9]{8}$' THEN '569' || n.d
  WHEN n.d = '' THEN NULL
  ELSE t."whatsapp"
END
FROM (
  SELECT "id", regexp_replace("whatsapp", '[^0-9]', '', 'g') AS d
  FROM "tenants"
  WHERE "whatsapp" IS NOT NULL
) AS n
WHERE t."id" = n."id";
