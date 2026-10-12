/**
 * Removes template/demo leftovers (Río Claro cities, offers, banners, photos) from tenants
 * provisioned before neutral defaults existed. Anything the company edited itself is kept.
 * Idempotent; dry-run unless --apply.
 *
 *   npx tsx scripts/neutralize-tenant-defaults.ts jimena-leiva            # show changes
 *   npx tsx scripts/neutralize-tenant-defaults.ts jimena-leiva --apply    # write them
 *   npx tsx scripts/neutralize-tenant-defaults.ts slug-a slug-b --apply
 */
import "dotenv/config";
import { Prisma, PrismaClient } from "@prisma/client";
import { parseModulesContent, type ModulesContent } from "../src/lib/modules";
import { parseHeroSlides } from "../src/lib/hero-slides";
import {
  TEMPLATE_TEXTS,
  isTemplateAsset,
  stripTemplateModulesContent,
  usesTemplateShowcase,
} from "../src/lib/storefront-defaults";

const PROTECTED = new Set(["demo", "rio-claro", "plataforma"]);

const args = process.argv.slice(2);
const apply = args.includes("--apply");
const slugs = args.filter((a) => !a.startsWith("--"));

if (!slugs.length) {
  console.error("Uso: npx tsx scripts/neutralize-tenant-defaults.ts <slug> [...slugs] [--apply]");
  process.exit(1);
}

const prisma = new PrismaClient();

function templateText(v: string | null): boolean {
  return v != null && TEMPLATE_TEXTS.has(v.trim());
}

function contentSummary(c: ModulesContent) {
  return {
    regions: c.regions.map((r) => r.name),
    descuentos: c.descuentos.length,
    planes: c.planes.length,
    kits: c.kits.length,
    redes: c.redes.length,
    certificaciones: c.certificaciones.length,
    hogar: c.hogar?.headline ?? null,
    empresa: c.empresa?.headline ?? null,
  };
}

/** Drops undefined keys so the stored JSON stays comparable between runs. */
function toJson(c: ModulesContent): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(c)) as Prisma.InputJsonValue;
}

async function neutralize(slug: string): Promise<boolean> {
  if (PROTECTED.has(slug)) {
    console.log(`- ${slug}: omitido (tienda plantilla/plataforma protegida)`);
    return false;
  }
  const tenant = await prisma.tenant.findUnique({ where: { slug } });
  if (!tenant) {
    console.log(`- ${slug}: no existe`);
    return false;
  }

  const data: Prisma.TenantUpdateInput = {};
  const notes: string[] = [];

  if (usesTemplateShowcase(tenant)) {
    console.log(`- ${slug}: usa el logo de la plantilla Río Claro (vitrina), omitido`);
    return false;
  }
  if (isTemplateAsset(tenant.heroImageUrl)) {
    data.heroImageUrl = null;
    notes.push(`heroImageUrl: ${tenant.heroImageUrl} → null`);
  }

  for (const key of ["deliveryBanner", "hoursBanner", "coverageText", "heroHeadline", "heroBody"] as const) {
    if (templateText(tenant[key])) {
      data[key] = null;
      notes.push(`${key}: "${tenant[key]}" → null`);
    }
  }

  const slides = parseHeroSlides(tenant.heroSlides);
  const keptSlides = slides.filter((s) => !isTemplateAsset(s.imageUrl));
  if (keptSlides.length !== slides.length) {
    data.heroSlides = keptSlides as unknown as Prisma.InputJsonValue;
    notes.push(`heroSlides: ${slides.length} → ${keptSlides.length} (sin fotos de plantilla)`);
  }

  const content = parseModulesContent(tenant.modulesContent);
  const cleaned = stripTemplateModulesContent(content);
  const before = JSON.stringify(toJson(content));
  const after = JSON.stringify(toJson(cleaned));
  if (before !== after) {
    data.modulesContent = toJson(cleaned);
    notes.push(
      `modulesContent: ${JSON.stringify(contentSummary(content))}\n               → ${JSON.stringify(
        contentSummary(cleaned),
      )}`,
    );
  }

  if (!notes.length) {
    console.log(`- ${slug}: sin cambios (ya neutral)`);
    return false;
  }

  console.log(`- ${slug} (${tenant.name}):`);
  for (const n of notes) console.log(`    ${n}`);
  if (apply) {
    await prisma.tenant.update({ where: { id: tenant.id }, data });
    console.log("    ✓ aplicado");
  }
  return true;
}

async function main() {
  console.log(apply ? "Modo APPLY" : "Modo dry-run (usa --apply para guardar)");
  let pending = 0;
  for (const slug of slugs) {
    if (await neutralize(slug.trim().toLowerCase())) pending++;
  }
  if (!apply && pending) console.log(`\n${pending} tienda(s) con cambios pendientes. Repite con --apply.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
