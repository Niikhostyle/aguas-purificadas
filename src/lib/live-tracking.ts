import type { LatLng } from "@/lib/geo";

/** A driver position older than this is shown as "sin señal" instead of live. */
export const LIVE_STALE_MS = 5 * 60 * 1000;
/** Minimum spacing between stored trail points. */
export const PING_MIN_INTERVAL_MS = 20 * 1000;
export const PING_MIN_DISTANCE_M = 25;
/** Trail points kept for the owner's map. */
export const TRAIL_WINDOW_MS = 4 * 60 * 60 * 1000;
export const PING_RETENTION_MS = 3 * 24 * 60 * 60 * 1000;

const AVG_SPEED_KMH = 22;
const MINUTES_PER_STOP = 6;

export function isLive(seenAt: Date | string | null | undefined, now = Date.now()): boolean {
  if (!seenAt) return false;
  return now - new Date(seenAt).getTime() <= LIVE_STALE_MS;
}

export function distanceMeters(a: LatLng, b: LatLng): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * Rough arrival estimate in minutes: straight-line distance at urban speed (×1.4 for street layout)
 * plus a fixed time per delivery still ahead of this one.
 */
export function etaMinutes(driver: LatLng, destination: LatLng, stopsBefore: number): number {
  const km = (distanceMeters(driver, destination) * 1.4) / 1000;
  return Math.max(2, Math.round((km / AVG_SPEED_KMH) * 60 + stopsBefore * MINUTES_PER_STOP));
}

export function agoLabel(seenAt: Date | string, now = Date.now()): string {
  const s = Math.max(0, Math.round((now - new Date(seenAt).getTime()) / 1000));
  if (s < 60) return "hace unos segundos";
  const m = Math.round(s / 60);
  if (m < 60) return `hace ${m} min`;
  return `hace ${Math.round(m / 60)} h`;
}

export type OrderTracking = {
  fulfillment: string;
  destination: LatLng | null;
  driver: { pos: LatLng; heading: number | null; seenAt: string; live: boolean } | null;
  driverName: string | null;
  stopsBefore: number;
  etaMin: number | null;
  deliveredAt: string | null;
};
