#!/usr/bin/env node
/**
 * Removes carousel and legacy discount images from every tenant:
 *   - tenants.heroSlides      → [] (hero carousel slides)
 *   - tenants.heroImageUrl    → null (legacy single hero image)
 *   - modulesContent.descuentos (legacy image offers, replaced by the Discount model) → removed
 * Product images, logos, kits, benefits and uploaded files on disk are left alone.
 *
 * Writes a JSON backup of every touched tenant's previous values before updating.
 * Idempotent: tenants with nothing to remove are skipped; a second run changes nothing.
 *
 * Usage (inside the app container):
 *   node scripts/remove-carousel-discount-images.mjs [--dry-run] [--backup-dir=/tmp] [--tenant=slug]
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  }),
);
const dryRun = Boolean(args["dry-run"]);
const backupDir = typeof args["backup-dir"] === "string" ? args["backup-dir"] : tmpdir();
const onlySlug = typeof args.tenant === "string" ? args.tenant : null;

const prisma = new PrismaClient();

function isObject(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

async function main() {
  const tenants = await prisma.tenant.findMany({
    where: onlySlug ? { slug: onlySlug } : undefined,
    select: { id: true, slug: true, heroSlides: true, heroImageUrl: true, modulesContent: true },
    orderBy: { slug: "asc" },
  });

  const changes = [];
  for (const t of tenants) {
    const slides = Array.isArray(t.heroSlides) ? t.heroSlides : [];
    const content = isObject(t.modulesContent) ? t.modulesContent : null;
    const hasDescuentos = Boolean(content && "descuentos" in content);
    if (!slides.length && !t.heroImageUrl && !hasDescuentos) continue;

    const data = {};
    if (slides.length) data.heroSlides = [];
    if (t.heroImageUrl) data.heroImageUrl = null;
    if (hasDescuentos) {
      const rest = { ...content };
      delete rest.descuentos;
      data.modulesContent = rest;
    }
    changes.push({
      tenant: t,
      data,
      summary: {
        slug: t.slug,
        heroSlides: slides.length,
        heroImageUrl: Boolean(t.heroImageUrl),
        descuentos: hasDescuentos ? (Array.isArray(content.descuentos) ? content.descuentos.length : 1) : 0,
      },
    });
  }

  if (!changes.length) {
    console.log("Nothing to remove: no tenant has carousel slides, hero image or legacy discount offers.");
    return;
  }

  for (const c of changes) console.log(dryRun ? "[dry-run]" : "", JSON.stringify(c.summary));
  if (dryRun) return;

  mkdirSync(backupDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupFile = join(backupDir, `carousel-discount-images-${stamp}.json`);
  const backup = changes.map(({ tenant }) => ({
    id: tenant.id,
    slug: tenant.slug,
    heroSlides: tenant.heroSlides,
    heroImageUrl: tenant.heroImageUrl,
    modulesContent: tenant.modulesContent,
  }));
  writeFileSync(backupFile, JSON.stringify(backup, null, 2));
  console.log(`Backup written: ${backupFile}`);

  await prisma.$transaction(
    changes.map(({ tenant, data }) =>
      prisma.tenant.update({ where: { id: tenant.id }, data }),
    ),
  );
  console.log(`Updated ${changes.length} tenant(s).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
