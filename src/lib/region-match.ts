import { stripAccents } from "@/lib/geo";
import type { RegionOption } from "@/lib/modules";

export type DetectedPlace = {
  /** Commune / town names, most specific first. */
  places: string[];
  state: string | null;
  source: "gps" | "ip";
};

function norm(s: string): string {
  return stripAccents(s)
    .toLowerCase()
    .replace(/\b(region|provincia|comuna)\s+(de\s+la|del|de\s+los|de)?\s*/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Region names may list several towns ("Talca / Curicó", "Viña del Mar, Valparaíso"). */
function nameParts(name: string): string[] {
  return name
    .split(/[\/,·|]|\s+y\s+/)
    .map(norm)
    .filter(Boolean);
}

/** Best region for a detected place: exact town match first, then the región (zone). */
export function matchRegion(regions: RegionOption[], place: DetectedPlace): RegionOption | null {
  const towns = place.places.map(norm).filter(Boolean);
  for (const town of towns) {
    const hit = regions.find((r) => nameParts(r.name).includes(town));
    if (hit) return hit;
  }
  if (place.state) {
    const state = norm(place.state);
    const byZone = regions.find((r) => {
      const zone = r.zone ? norm(r.zone) : "";
      return Boolean(zone) && (zone === state || state.startsWith(`${zone} `) || zone.startsWith(`${state} `));
    });
    if (byZone) return byZone;
  }
  return null;
}

export function placeLabel(place: DetectedPlace): string {
  return place.places[0] || place.state || "";
}
