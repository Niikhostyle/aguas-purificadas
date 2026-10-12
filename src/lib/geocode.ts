import { prisma } from "@/lib/db";
import { DISPATCHABLE_PAYMENT } from "@/lib/dispatch";
import { isValidChileCoord, stripAccents } from "@/lib/geo";

/**
 * Server-side geocoding with Nominatim (OpenStreetMap), following its usage policy:
 * identifying User-Agent with contact, at most 1 request/second per process, results
 * cached in `geocode_cache` (including misses) and never called while rendering a page.
 * https://operations.osmfoundation.org/policies/nominatim/
 */

const NOMINATIM_URL = process.env.NOMINATIM_URL || "https://nominatim.openstreetmap.org/search";
const CONTACT_EMAIL = process.env.GEOCODER_CONTACT_EMAIL || "hola@mibidon.cl";
const USER_AGENT =
  process.env.GEOCODER_USER_AGENT || `MiBidon/1.0 (+https://mibidon.cl; ${CONTACT_EMAIL})`;
const MIN_INTERVAL_MS = 1100;

let queue: Promise<unknown> = Promise.resolve();
let lastRequestAt = 0;

/** Serializes every Nominatim call in this process and spaces them ≥1.1 s apart. */
function throttled<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(async () => {
    const wait = lastRequestAt + MIN_INTERVAL_MS - Date.now();
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    try {
      return await fn();
    } finally {
      lastRequestAt = Date.now();
    }
  });
  queue = run.catch(() => undefined);
  return run;
}

/** Apartment/office details confuse the geocoder and don't change the building location. */
function streetOnly(address: string): string {
  return address
    .split(/,\s*(?:depto|dpto|departamento|of\.?|oficina|casa|block|torre|piso)\b/i)[0]
    .replace(/\b(?:depto|dpto|departamento|of\.?|oficina)\s*\S+$/i, "")
    .trim();
}

export function geoQuery(address: string, commune?: string | null, city?: string | null): string {
  const parts = [streetOnly(address), commune || city, "Chile"].filter(Boolean) as string[];
  return stripAccents(parts.join(", "))
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

type GeoHit = { lat: number; lng: number } | null;

async function fetchNominatim(query: string): Promise<{ hit: GeoHit; displayName?: string } | "error"> {
  return throttled(async () => {
    const url = new URL(NOMINATIM_URL);
    url.searchParams.set("q", query);
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("limit", "1");
    url.searchParams.set("countrycodes", "cl");
    url.searchParams.set("email", CONTACT_EMAIL);
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": USER_AGENT, "Accept-Language": "es" },
        signal: AbortSignal.timeout(10_000),
        cache: "no-store",
      });
      if (!res.ok) return "error";
      const rows = (await res.json()) as { lat: string; lon: string; display_name?: string }[];
      const row = rows[0];
      if (!row) return { hit: null };
      const lat = Number(row.lat);
      const lng = Number(row.lon);
      if (!isValidChileCoord(lat, lng)) return { hit: null };
      return { hit: { lat, lng }, displayName: row.display_name };
    } catch {
      return "error";
    }
  });
}

/** Cached lookup. Returns undefined on transient errors (nothing cached, retry later). */
export async function geocodeQuery(query: string): Promise<GeoHit | undefined> {
  const cached = await prisma.geocodeCache.findUnique({ where: { query } });
  if (cached) return cached.status === "ok" && cached.lat != null && cached.lng != null ? { lat: cached.lat, lng: cached.lng } : null;
  const res = await fetchNominatim(query);
  if (res === "error") return undefined;
  await prisma.geocodeCache.upsert({
    where: { query },
    update: {},
    create: {
      query,
      status: res.hit ? "ok" : "not_found",
      lat: res.hit?.lat ?? null,
      lng: res.hit?.lng ?? null,
      displayName: res.displayName?.slice(0, 300) ?? null,
    },
  });
  return res.hit;
}

export type ReversePlace = { places: string[]; state: string | null };

const REVERSE_URL = NOMINATIM_URL.replace(/\/search\/?$/, "/reverse");
const reverseCache = new Map<string, ReversePlace | null>();
const REVERSE_CACHE_MAX = 2000;

/**
 * Town/commune names around a point (most specific first) plus its región. Coordinates are
 * rounded to ~1 km so nearby visitors share one Nominatim call. Undefined on transient errors.
 */
export async function reverseGeocode(lat: number, lng: number): Promise<ReversePlace | null | undefined> {
  if (!isValidChileCoord(lat, lng)) return null;
  const key = `${lat.toFixed(2)},${lng.toFixed(2)}`;
  if (reverseCache.has(key)) return reverseCache.get(key) ?? null;

  const result = await throttled(async (): Promise<ReversePlace | null | undefined> => {
    const url = new URL(REVERSE_URL);
    url.searchParams.set("lat", lat.toFixed(4));
    url.searchParams.set("lon", lng.toFixed(4));
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("zoom", "12");
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("email", CONTACT_EMAIL);
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": USER_AGENT, "Accept-Language": "es" },
        signal: AbortSignal.timeout(10_000),
        cache: "no-store",
      });
      if (!res.ok) return undefined;
      const body = (await res.json()) as { address?: Record<string, string> };
      const a = body.address;
      if (!a || a.country_code !== "cl") return null;
      const places = [a.city, a.town, a.village, a.suburb, a.municipality, a.city_district, a.county, a.province]
        .filter((v): v is string => Boolean(v?.trim()));
      return { places: [...new Set(places)], state: a.state || a.region || null };
    } catch {
      return undefined;
    }
  });

  if (result !== undefined) {
    if (reverseCache.size >= REVERSE_CACHE_MAX) reverseCache.clear();
    reverseCache.set(key, result);
  }
  return result;
}

export type LocateResult = "located" | "reused" | "not_found" | "skipped" | "error";

/** Locates one order (tenant-scoped), reusing the delivery customer's known location when the address matches. */
export async function locateOrder(tenantId: string, orderId: string, opts: { force?: boolean } = {}): Promise<LocateResult> {
  const order = await prisma.order.findFirst({
    where: { id: orderId, tenantId },
    select: {
      id: true,
      lat: true,
      geoSource: true,
      customerAddress: true,
      deliveryCommune: true,
      deliveryCustomerId: true,
      deliveryCustomer: { select: { lat: true, lng: true, geoAddress: true } },
      tenant: { select: { city: true } },
    },
  });
  if (!order) return "skipped";
  if (order.lat != null && !opts.force) return "skipped";
  if (order.geoSource === "manual" && !opts.force) return "skipped";

  const query = geoQuery(order.customerAddress, order.deliveryCommune, order.tenant.city);
  const c = order.deliveryCustomer;
  if (c?.lat != null && c.lng != null && c.geoAddress === query) {
    await prisma.order.updateMany({
      where: { id: order.id, tenantId },
      data: { lat: c.lat, lng: c.lng, geoSource: "cliente", geocodedAt: new Date() },
    });
    return "reused";
  }

  const hit = await geocodeQuery(query);
  if (hit === undefined) return "error";
  if (!hit) {
    await prisma.order.updateMany({
      where: { id: order.id, tenantId },
      data: { geoSource: "no_encontrado", geocodedAt: new Date() },
    });
    return "not_found";
  }
  await prisma.order.updateMany({
    where: { id: order.id, tenantId },
    data: { lat: hit.lat, lng: hit.lng, geoSource: "nominatim", geocodedAt: new Date() },
  });
  if (order.deliveryCustomerId) {
    await prisma.deliveryCustomer.updateMany({
      where: { id: order.deliveryCustomerId, tenantId },
      data: { lat: hit.lat, lng: hit.lng, geoSource: "nominatim", geoAddress: query },
    });
  }
  return "located";
}

/** Orders still without coordinates (never retries "no_encontrado" unless asked). */
export async function locatePendingOrders(opts: {
  tenantId?: string;
  limit: number;
  retryNotFound?: boolean;
  onProgress?: (orderId: string, result: LocateResult) => void;
}) {
  const orders = await prisma.order.findMany({
    where: {
      ...(opts.tenantId ? { tenantId: opts.tenantId } : {}),
      lat: null,
      status: { in: DISPATCHABLE_PAYMENT },
      ...(opts.retryNotFound ? {} : { OR: [{ geoSource: null }, { geoSource: { not: "no_encontrado" } }] }),
    },
    orderBy: [{ deliveryDate: { sort: "desc", nulls: "first" } }, { createdAt: "desc" }],
    select: { id: true, tenantId: true },
    take: opts.limit,
  });
  const tally: Record<LocateResult, number> = { located: 0, reused: 0, not_found: 0, skipped: 0, error: 0 };
  for (const o of orders) {
    const r = await locateOrder(o.tenantId, o.id, { force: opts.retryNotFound });
    tally[r]++;
    opts.onProgress?.(o.id, r);
    if (r === "error") break;
  }
  return { checked: orders.length, ...tally };
}

/** Admin correction from the map: pins the order and remembers it for the customer. */
export async function setOrderLocation(tenantId: string, orderId: string, lat: number, lng: number) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, tenantId },
    select: {
      id: true,
      customerAddress: true,
      deliveryCommune: true,
      deliveryCustomerId: true,
      tenant: { select: { city: true } },
    },
  });
  if (!order) return false;
  await prisma.order.updateMany({
    where: { id: order.id, tenantId },
    data: { lat, lng, geoSource: "manual", geocodedAt: new Date() },
  });
  if (order.deliveryCustomerId) {
    await prisma.deliveryCustomer.updateMany({
      where: { id: order.deliveryCustomerId, tenantId },
      data: {
        lat,
        lng,
        geoSource: "manual",
        geoAddress: geoQuery(order.customerAddress, order.deliveryCommune, order.tenant.city),
      },
    });
  }
  return true;
}
