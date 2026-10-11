import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import { LANDING_DEFAULTS } from "@/lib/landing/defaults";
import {
  LANDING_SECTION_KEYS,
  landingSchemas,
  type LandingContent,
  type LandingSectionKey,
} from "@/lib/landing/schema";

export const LANDING_CACHE_TAG = "platform-landing";

type Row = { key: string; enabled: boolean; content: unknown };

function mergeRows(rows: Row[]): LandingContent {
  const byKey = new Map(rows.map((r) => [r.key, r]));
  const out = {} as Record<LandingSectionKey, unknown>;
  for (const key of LANDING_SECTION_KEYS) {
    const row = byKey.get(key);
    const fallback = LANDING_DEFAULTS[key];
    if (!row) {
      out[key] = fallback;
      continue;
    }
    const parsed = landingSchemas[key].safeParse(row.content);
    out[key] = {
      enabled: row.enabled,
      content: parsed.success ? parsed.data : fallback.content,
    };
  }
  return out as LandingContent;
}

/** Uncached read for the admin panel. Throws when the DB is unreachable. */
export async function readLandingContent(): Promise<LandingContent> {
  const rows = await prisma.platformLandingSection.findMany();
  return mergeRows(rows);
}

// Throws on DB failure so the fallback below is never written into the cache.
const cachedRows = unstable_cache(
  async () =>
    prisma.platformLandingSection.findMany({
      select: { key: true, enabled: true, content: true },
    }),
  ["platform-landing-sections"],
  { tags: [LANDING_CACHE_TAG], revalidate: 3600 },
);

/** Public landing read: tag-cached, never throws (falls back to Stitch v2 defaults). */
export async function getLandingContent(): Promise<LandingContent> {
  try {
    return mergeRows(await cachedRows());
  } catch (e) {
    if (process.env.NEXT_PHASE !== "phase-production-build") {
      console.error("[landing] CMS read failed, using defaults:", e);
    }
    return LANDING_DEFAULTS;
  }
}
