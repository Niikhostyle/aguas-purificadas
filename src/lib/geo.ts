/** Client-safe map constants and types shared by the dispatch map and its server loader. */

export type LatLng = [number, number];

export const SANTIAGO: LatLng = [-33.4489, -70.6693];

/** Approximate centers for common tenant cities (fallback when no order is located yet). */
const CITY_CENTERS: Record<string, LatLng> = {
  santiago: SANTIAGO,
  "valparaiso": [-33.0472, -71.6127],
  "vina del mar": [-33.0245, -71.5518],
  "concepcion": [-36.8201, -73.0444],
  temuco: [-38.7359, -72.5904],
  talca: [-35.4264, -71.6554],
  rancagua: [-34.1708, -70.7444],
  "la serena": [-29.9027, -71.2519],
  coquimbo: [-29.9533, -71.3436],
  antofagasta: [-23.6509, -70.3975],
  iquique: [-20.2133, -70.1503],
  arica: [-18.4783, -70.3126],
  "puerto montt": [-41.4689, -72.9411],
  osorno: [-40.5739, -73.1335],
  valdivia: [-39.8142, -73.2459],
  chillan: [-36.6066, -72.1034],
  "los angeles": [-37.4697, -72.3537],
  curico: [-34.9828, -71.2394],
  "punta arenas": [-53.1638, -70.9171],
  copiapo: [-27.3668, -70.3323],
  calama: [-22.4544, -68.9294],
};

export function stripAccents(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function cityCenter(city: string | null | undefined): LatLng {
  if (!city) return SANTIAGO;
  return CITY_CENTERS[stripAccents(city).toLowerCase().trim()] ?? SANTIAGO;
}

/** Rough Chile bounding box (incl. Easter Island excluded) to reject bogus coordinates. */
export function isValidChileCoord(lat: number, lng: number): boolean {
  return Number.isFinite(lat) && Number.isFinite(lng) && lat <= -17 && lat >= -56.5 && lng <= -66 && lng >= -76;
}

export const PIN_STATUSES = ["por_asignar", "programado", "en_ruta", "entregado", "no_entregado"] as const;

export const PIN_COLOR: Record<string, string> = {
  por_asignar: "#f59e0b",
  programado: "#3b82f6",
  en_ruta: "#06b6d4",
  entregado: "#10b981",
  no_entregado: "#e11d48",
};

export const PIN_LABEL: Record<string, string> = {
  por_asignar: "Pendiente",
  programado: "Programado",
  en_ruta: "En ruta",
  entregado: "Entregado",
  no_entregado: "No entregado",
};

/** Route polylines; index 0/1 are replaced on the client by the tenant's --brand / --brand-deep. */
export const ROUTE_COLORS = ["#00b1e2", "#12326e", "#8b5cf6", "#f97316", "#10b981", "#e11d48", "#0ea5e9", "#a16207"];

export type MapOrder = {
  id: string;
  ref: string;
  lat: number;
  lng: number;
  status: string;
  payment: string;
  customerName: string;
  address: string;
  commune: string | null;
  items: string;
  totalClp: number;
  bottles: number;
  routeId: string | null;
  routeStop: number | null;
  slot: string | null;
  geoSource: string | null;
  /** Address not found by the geocoder: pin parked near the city center until the admin drags it. */
  approx?: boolean;
};

export type MapRoute = {
  id: string;
  name: string;
  driverName: string | null;
  status: string;
  colorIndex: number;
  stops: LatLng[];
  driverPos: LatLng | null;
  total: number;
  delivered: number;
};

export type DispatchMapData = {
  center: LatLng;
  orders: MapOrder[];
  routes: MapRoute[];
  /** Orders matching the filters still waiting to be geocoded. */
  unlocated: number;
  /** Orders whose address the geocoder couldn't find (shown as approximate pins). */
  notFound: number;
};
