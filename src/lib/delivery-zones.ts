import { stripAccents } from "@/lib/geo";

export type ZonePricing = { costClp: number; freeOverClp: number | null };

/** Shipping for an order whose total (after discounts, before shipping) is `orderTotalClp`. */
export function shippingFor(zone: ZonePricing, orderTotalClp: number): number {
  if (zone.freeOverClp != null && zone.freeOverClp > 0 && orderTotalClp >= zone.freeOverClp) return 0;
  return zone.costClp;
}

export function splitCommunes(communes: string): string[] {
  return communes
    .split(/[,\n]/)
    .map((c) => c.trim())
    .filter(Boolean);
}

/** Zones still as created at onboarding (never edited) or none active: the tenant must configure them. */
export function zonesNeedSetup(zones: { active: boolean; createdAt: Date; updatedAt: Date }[]): boolean {
  const active = zones.filter((z) => z.active);
  if (!active.length) return true;
  return zones.every((z) => z.updatedAt.getTime() - z.createdAt.getTime() < 1000);
}

function norm(s: string): string {
  return stripAccents(s).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

/** Zone that covers a town/commune name (from the region selector), if any. */
export function zoneForPlace<Z extends { name: string; communes: string }>(zones: Z[], place: string): Z | undefined {
  const parts = place.split(/[\/,]/).map(norm).filter(Boolean);
  if (!parts.length) return undefined;
  return zones.find((z) => {
    const names = [z.name, ...splitCommunes(z.communes)].map(norm);
    return names.some((n) => parts.some((p) => n === p));
  });
}
