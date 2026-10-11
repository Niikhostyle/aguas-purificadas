/**
 * Prints idempotent INSERTs for the apex landing CMS defaults.
 *   npx tsx scripts/landing-seed-sql.ts > seed.sql
 * Existing rows are never overwritten (ON CONFLICT DO NOTHING).
 */
import { LANDING_DEFAULTS } from "../src/lib/landing/defaults";
import { LANDING_SECTION_KEYS, landingSchemas } from "../src/lib/landing/schema";

const lines: string[] = [];
for (const key of LANDING_SECTION_KEYS) {
  const section = LANDING_DEFAULTS[key];
  const content = landingSchemas[key].parse(section.content);
  const json = JSON.stringify(content);
  if (json.includes("$seed$")) throw new Error("delimiter collision");
  lines.push(
    `INSERT INTO "platform_landing_sections" ("key", "enabled", "content", "updatedAt")\n` +
      `VALUES ('${key}', ${section.enabled}, $seed$${json}$seed$::jsonb, CURRENT_TIMESTAMP)\n` +
      `ON CONFLICT ("key") DO NOTHING;`,
  );
}
process.stdout.write(lines.join("\n\n") + "\n");
