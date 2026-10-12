/**
 * Syncs the apex landing CMS rows (`platform_landing_sections`) with the concise
 * copy in src/lib/landing/defaults.ts. Idempotent: rows that already match are skipped.
 *
 *   npx tsx scripts/landing-apply-concise.ts            # dry-run (default)
 *   npx tsx scripts/landing-apply-concise.ts --apply    # writes; saves a JSON backup first
 *
 * Env: DATABASE_URL. The public page caches CMS rows for up to 1 h (tag "platform-landing");
 * after --apply, save any section in /admin/plataforma/landing or restart the app to refresh.
 */
import "dotenv/config";
import { writeFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";
import { LANDING_DEFAULTS } from "../src/lib/landing/defaults";
import { LANDING_SECTION_KEYS, landingSchemas } from "../src/lib/landing/schema";

const APPLY = process.argv.includes("--apply");
const UPDATED_BY = "script:landing-apply-concise";

function canonical(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(canonical).join(",")}]`;
  if (v && typeof v === "object") {
    const o = v as Record<string, unknown>;
    return `{${Object.keys(o)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${canonical(o[k])}`)
      .join(",")}}`;
  }
  return JSON.stringify(v);
}

function words(v: unknown): number {
  const strings: string[] = [];
  const walk = (x: unknown, key = "") => {
    if (typeof x === "string") {
      if (!/(^id$|Href$|Url$|^icon$|whatsappMessage)/.test(key)) strings.push(x);
    } else if (Array.isArray(x)) x.forEach((i) => walk(i, key));
    else if (x && typeof x === "object") Object.entries(x).forEach(([k, i]) => walk(i, k));
  };
  walk(v);
  return strings.join(" ").split(/\s+/).filter(Boolean).length;
}

async function main() {
  const prisma = new PrismaClient();
  try {
    const rows = await prisma.platformLandingSection.findMany();
    const byKey = new Map(rows.map((r) => [r.key, r]));
    const changes: { key: string; enabled: boolean; content: object }[] = [];

    console.log(`Modo: ${APPLY ? "APPLY (escribe en la DB)" : "DRY-RUN (sin cambios)"}\n`);
    for (const key of LANDING_SECTION_KEYS) {
      const target = LANDING_DEFAULTS[key];
      const content = landingSchemas[key].parse(target.content) as object;
      const row = byKey.get(key);
      const same =
        row && row.enabled === target.enabled && canonical(row.content) === canonical(content);
      const action = !row ? "crear" : same ? "sin cambios" : "actualizar";
      const enabledInfo = row && row.enabled !== target.enabled ? ` enabled ${row.enabled}→${target.enabled}` : "";
      const wordInfo = `palabras ${row ? words(row.content) : 0}→${words(content)}`;
      console.log(`${key.padEnd(13)} ${action.padEnd(11)} ${wordInfo}${enabledInfo}`);
      if (!same) changes.push({ key, enabled: target.enabled, content });
    }

    const unknown = rows.filter((r) => !(LANDING_SECTION_KEYS as string[]).includes(r.key));
    if (unknown.length) console.log(`\nFilas desconocidas (no se tocan): ${unknown.map((r) => r.key).join(", ")}`);

    if (!changes.length) {
      console.log("\nNada que hacer: el CMS ya tiene el contenido conciso.");
      return;
    }
    if (!APPLY) {
      console.log(`\n${changes.length} sección(es) cambiarían. Ejecuta con --apply para escribir.`);
      return;
    }

    const backup = `landing-backup-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
    writeFileSync(backup, JSON.stringify(rows, null, 2));
    console.log(`\nRespaldo de filas actuales: ${backup}`);

    await prisma.$transaction(
      changes.map((c) =>
        prisma.platformLandingSection.upsert({
          where: { key: c.key },
          create: { key: c.key, enabled: c.enabled, content: c.content, updatedBy: UPDATED_BY },
          update: { enabled: c.enabled, content: c.content, updatedBy: UPDATED_BY },
        }),
      ),
    );
    console.log(`${changes.length} sección(es) actualizadas.`);
    console.log(
      "Refresca la caché: guarda cualquier sección en /admin/plataforma/landing o reinicia la app.",
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
