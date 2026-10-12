"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet";
import type { LatLng } from "@/lib/geo";

const TILE_URL = process.env.NEXT_PUBLIC_MAP_TILE_URL || "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const TILE_ATTRIBUTION =
  process.env.NEXT_PUBLIC_MAP_TILE_ATTRIBUTION ||
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

const TRUCK_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>';

const truckIcon = (live: boolean) =>
  L.divIcon({
    className: "",
    html: `<div style="display:grid;place-items:center;width:40px;height:40px;border-radius:9999px;background:${live ? "var(--brand)" : "#94a3b8"};color:#fff;border:3px solid #fff;box-shadow:0 6px 16px rgba(15,40,70,.25)">${TRUCK_SVG}</div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });

const homeIcon = L.divIcon({
  className: "",
  html: '<div style="width:22px;height:22px;border-radius:9999px;background:var(--brand-deep);border:4px solid #fff;box-shadow:0 4px 12px rgba(15,40,70,.3)"></div>',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

function Fit({ points }: { points: LatLng[] }) {
  const map = useMap();
  const key = points.map((p) => p.map((n) => n.toFixed(3)).join(",")).join("|");
  useEffect(() => {
    if (points.length === 1) map.setView(points[0], 15);
    else if (points.length > 1) map.fitBounds(L.latLngBounds(points), { padding: [48, 48], maxZoom: 16 });
    // Refit only when a point moves noticeably, so the customer can pan without being yanked back.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, map]);
  return null;
}

export default function OrderTrackingMap({
  driver,
  live,
  destination,
}: {
  driver: LatLng | null;
  live: boolean;
  destination: LatLng | null;
}) {
  const [center] = useState<LatLng>(() => driver ?? destination ?? [-33.45, -70.66]);
  const points = useMemo(() => [driver, destination].filter(Boolean) as LatLng[], [driver, destination]);
  const icon = useMemo(() => truckIcon(live), [live]);
  return (
    <MapContainer center={center} zoom={14} scrollWheelZoom={false} className="h-full w-full" attributionControl>
      <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} maxZoom={19} />
      <Fit points={points} />
      {destination ? <Marker position={destination} icon={homeIcon} title="Tu dirección" /> : null}
      {driver ? <Marker position={driver} icon={icon} zIndexOffset={500} title="Camión de reparto" /> : null}
    </MapContainer>
  );
}
