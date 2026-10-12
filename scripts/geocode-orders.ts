/**
 * Geocodes orders that still have no coordinates using Nominatim (OpenStreetMap),
 * 1 request/second max, with results cached in geocode_cache. Safe to re-run.
 *
 * Usage:
 *   npx tsx scripts/geocode-orders.ts [--tenant=<slug>] [--limit=200] [--retry-not-found]
 *
 * Env: DATABASE_URL, optional GEOCODER_CONTACT_EMAIL / GEOCODER_USER_AGENT / NOMINATIM_URL.
 */
import "dotenv/config";
import { prisma } from "../src/lib/db";
import { locatePendingOrders } from "../src/lib/geocode";

function arg(name: string): string | undefined {
  const hit = process.argv.find((a) => a === `--${name}` || a.startsWith(`--${name}=`));
  if (!hit) return undefined;
  return hit.includes("=") ? hit.split("=").slice(1).join("=") : "true";
}

async function main() {
  const slug = arg("tenant");
  const limit = Math.max(1, Math.min(5000, Number(arg("limit") ?? 200) || 200));
  let tenantId: string | undefined;
  if (slug) {
    const tenant = await prisma.tenant.findUnique({ where: { slug }, select: { id: true } });
    if (!tenant) throw new Error(`Tenant ${slug} not found`);
    tenantId = tenant.id;
  }
  console.log(`Geocoding up to ${limit} orders${slug ? ` of "${slug}"` : " (all tenants)"} at ≤1 req/s…`);
  const res = await locatePendingOrders({
    tenantId,
    limit,
    retryNotFound: arg("retry-not-found") === "true",
    onProgress: (id, r) => console.log(`  ${id}  ${r}`),
  });
  console.log(
    `Done: ${res.checked} checked · ${res.located} geocoded · ${res.reused} reused from customer · ${res.not_found} not found · ${res.error} errors`,
  );
  if (res.error) console.log("Stopped early: the geocoder did not respond; run again later.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
