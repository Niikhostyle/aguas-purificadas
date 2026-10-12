import { reverseGeocode } from "@/lib/geocode";

// Nominatim allows ~1 req/s per process; don't let anonymous visitors queue up behind each other.
const MAX_PENDING = 4;
let pending = 0;

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
}

function headerCoords(headers: Headers): [number, number] | null {
  const lat = Number(headers.get("cf-iplatitude"));
  const lng = Number(headers.get("cf-iplongitude"));
  return headers.get("cf-iplatitude") && Number.isFinite(lat) && Number.isFinite(lng) ? [lat, lng] : null;
}

/**
 * Where the visitor is, for preselecting a delivery region. `?lat=&lng=` comes from the browser
 * Geolocation API; otherwise Cloudflare's visitor-location headers are used when present.
 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const qLat = Number(params.get("lat"));
  const qLng = Number(params.get("lng"));
  const fromGps = params.has("lat") && params.has("lng") && Number.isFinite(qLat) && Number.isFinite(qLng);

  const country = request.headers.get("cf-ipcountry");
  if (!fromGps && country && country !== "CL") return json({ place: null });

  const coords: [number, number] | null = fromGps ? [qLat, qLng] : headerCoords(request.headers);
  if (!coords) {
    const city = request.headers.get("cf-ipcity");
    const region = request.headers.get("cf-region");
    if (!city && !region) return json({ place: null });
    return json({ place: { places: city ? [city] : [], state: region, source: "ip" } });
  }

  if (pending >= MAX_PENDING) return json({ error: "busy" }, 503);
  pending++;
  try {
    const hit = await reverseGeocode(coords[0], coords[1]);
    if (hit === undefined) return json({ error: "unavailable" }, 503);
    if (!hit) return json({ place: null });
    return json({ place: { ...hit, source: fromGps ? "gps" : "ip" } });
  } finally {
    pending--;
  }
}
