-- Sample videos and Río Claro photos that the old demo content copied into every tenant.
UPDATE "tenants"
SET "modulesContent" = jsonb_set(
  "modulesContent",
  '{redes}',
  COALESCE((
    SELECT jsonb_agg(item)
    FROM jsonb_array_elements("modulesContent"->'redes') AS item
    WHERE item->>'url' NOT IN ('https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'https://www.instagram.com/')
  ), '[]'::jsonb)
)
WHERE jsonb_typeof("modulesContent"->'redes') = 'array'
  AND "modulesContent"::text LIKE ANY (ARRAY['%dQw4w9WgXcQ%', '%"https://www.instagram.com/"%']);

UPDATE "tenants"
SET "modulesContent" = jsonb_set(
  "modulesContent",
  '{kits}',
  (
    SELECT COALESCE(jsonb_agg(
      CASE WHEN item->>'imageUrl' LIKE '/brand/rio-claro/%' THEN item - 'imageUrl' ELSE item END
    ), '[]'::jsonb)
    FROM jsonb_array_elements("modulesContent"->'kits') AS item
  )
)
WHERE "slug" NOT LIKE 'rio-claro%'
  AND jsonb_typeof("modulesContent"->'kits') = 'array'
  AND ("modulesContent"->'kits')::text LIKE '%/brand/rio-claro/%';

UPDATE "tenants"
SET "modulesContent" = jsonb_set(
  "modulesContent",
  '{certificaciones}',
  (
    SELECT COALESCE(jsonb_agg(
      CASE WHEN item->>'logoUrl' LIKE '/brand/rio-claro/%' THEN item - 'logoUrl' ELSE item END
    ), '[]'::jsonb)
    FROM jsonb_array_elements("modulesContent"->'certificaciones') AS item
  )
)
WHERE "slug" NOT LIKE 'rio-claro%'
  AND jsonb_typeof("modulesContent"->'certificaciones') = 'array'
  AND ("modulesContent"->'certificaciones')::text LIKE '%/brand/rio-claro/%';
