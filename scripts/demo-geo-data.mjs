/**
 * Real-world coordinates for the demo dispatch customers (Santiago), keyed by the
 * exact address used in scripts/seed-demo-dispatch.mjs. Shared with
 * scripts/backfill-demo-geo.mjs so both stay in sync.
 */
export const DEMO_COORDS = {
  "Av. Providencia 1840, depto 1203": [-33.42452, -70.61095],
  "Eliodoro Yáñez 2250": [-33.43215, -70.60238],
  "Irarrázaval 3410, depto 504": [-33.45398, -70.59612],
  "Pedro de Valdivia 4120": [-33.46205, -70.60391],
  "San Diego 980": [-33.46001, -70.65002],
  "Lira 455, depto 81": [-33.44953, -70.63998],
  "Av. Pajaritos 3120": [-33.49702, -70.74806],
  "5 de Abril 1050": [-33.51048, -70.75693],
  "Vicuña Mackenna 7350": [-33.52098, -70.59802],
  "Walker Martínez 1420": [-33.52204, -70.58997],
  "Concha y Toro 2890": [-33.58512, -70.58013],
  "Av. Gabriela 1765": [-33.57954, -70.59052],
  "Apoquindo 5400, of. 302": [-33.41297, -70.58003],
  "Manquehue Sur 520": [-33.41402, -70.56995],
  "Vitacura 6780": [-33.39203, -70.57702],
  "Príncipe de Gales 6930": [-33.44102, -70.55897],
  "Larraín 8120": [-33.44896, -70.54503],
  "Av. Ossa 1450": [-33.45498, -70.57702],
  "Santa Rosa 7020": [-33.52496, -70.63403],
  "Américo Vespucio 1500": [-33.49304, -70.71802],
  "Holanda 3150": [-33.43353, -70.60748],
  "Las Condes 11200": [-33.38097, -70.53203],
};

/** Mirrors geoQuery() in src/lib/geocode.ts so seeded customers are reused for new orders. */
export function demoGeoQuery(address, commune) {
  const street = address
    .split(/,\s*(?:depto|dpto|departamento|of\.?|oficina|casa|block|torre|piso)\b/i)[0]
    .replace(/\b(?:depto|dpto|departamento|of\.?|oficina)\s*\S+$/i, "")
    .trim();
  return [street, commune, "Chile"]
    .filter(Boolean)
    .join(", ")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** Demo stock so the "Inventario en tiempo real" panel has data (only fills products with no stock). */
export function demoStockFor(name) {
  if (/dispensador|surtidor/i.test(name)) return 6;
  if (/20\s*l/i.test(name)) return 140;
  if (/bid[oó]n|botell[oó]n|recarga/i.test(name)) return 85;
  return null;
}
