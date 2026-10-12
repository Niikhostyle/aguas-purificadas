"use client";

import "leaflet/dist/leaflet.css";
import "./dispatch-map.css";
import L from "leaflet";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, Marker, Polyline, Popup, TileLayer, Tooltip, ZoomControl, useMap } from "react-leaflet";
import { Crosshair, ExternalLink, Move, Navigation } from "lucide-react";
import { setOrderLocationAction } from "@/app/admin/(panel)/despacho/map-actions";
import { confirmAction, toast } from "@/lib/alerts";
import {
  PIN_COLOR,
  PIN_LABEL,
  PIN_STATUSES,
  ROUTE_COLORS,
  type DispatchMapData,
  type LatLng,
  type MapOrder,
} from "@/lib/geo";
import { agoLabel } from "@/lib/live-tracking";
import { cn, formatClp } from "@/lib/utils";

export const MAP_FOCUS_EVENT = "dispatch-map:focus";

/** Keyless OpenStreetMap tiles by default; a self-hosted or keyed provider can be set per deploy. */
const TILE_URL = process.env.NEXT_PUBLIC_MAP_TILE_URL || "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const TILE_ATTRIBUTION =
  process.env.NEXT_PUBLIC_MAP_TILE_ATTRIBUTION ||
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

/** Keeps opened popups clear of the legend/toolbar overlay at the top of the map. */
const POPUP_PAD_TOP_LEFT = L.point(16, 96);
const POPUP_PAD_BOTTOM_RIGHT = L.point(56, 16);

const TRUCK_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>';

function pinIcon(o: MapOrder, draggable: boolean, focused: boolean) {
  const color = o.approx ? "#94a3b8" : (PIN_COLOR[o.status] ?? "#64748b");
  const numbered = o.approx || o.routeStop;
  const label = o.approx ? "<span>?</span>" : o.routeStop ? `<span>${o.routeStop}</span>` : "<span></span>";
  return L.divIcon({
    className: "",
    html: `<div class="mb-pin${numbered ? "" : " mb-pin-dot"}${o.approx ? " mb-pin-approx" : ""}${draggable ? " mb-pin-draggable" : ""}${focused ? " mb-pin-focus" : ""}" style="--pin:${color}">${label}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 34],
    popupAnchor: [0, -32],
  });
}

function driverIcon(color: string, live: boolean) {
  return L.divIcon({
    className: "",
    html: `<div class="mb-driver${live ? " mb-driver-live" : " mb-driver-estimated"}" style="--drv:${color}">${TRUCK_SVG}</div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -18],
  });
}

function themePalette(): string[] {
  if (typeof document === "undefined") return ROUTE_COLORS;
  const el = document.querySelector<HTMLElement>("[data-admin-theme]");
  if (!el) return ROUTE_COLORS;
  const s = getComputedStyle(el);
  const brand = s.getPropertyValue("--brand").trim();
  const deep = s.getPropertyValue("--brand-deep").trim();
  return [brand || ROUTE_COLORS[0], deep || ROUTE_COLORS[1], ...ROUTE_COLORS.slice(2)];
}

function fitTo(map: L.Map, points: LatLng[], center: LatLng) {
  if (points.length === 0) map.setView(center, 12);
  else if (points.length === 1) map.setView(points[0], 15);
  else map.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom: 15 });
}

/** Refits only when the set of visible orders changes, so saving a dragged pin doesn't jump the view. */
function FitBounds({ points, center, idsKey }: { points: LatLng[]; center: LatLng; idsKey: string }) {
  const map = useMap();
  useEffect(() => {
    fitTo(map, points, center);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey, map]);
  return null;
}

function ResizeWatcher() {
  const map = useMap();
  useEffect(() => {
    const el = map.getContainer();
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(el);
    return () => ro.disconnect();
  }, [map]);
  return null;
}

function OrderMarker({
  o,
  draggable,
  focused,
  register,
}: {
  o: MapOrder;
  draggable: boolean;
  focused: boolean;
  register: (id: string, m: L.Marker | null) => void;
}) {
  const router = useRouter();
  const ref = useRef<L.Marker | null>(null);
  const icon = useMemo(() => pinIcon(o, draggable, focused), [o, draggable, focused]);
  const handlers = useMemo(
    () => ({
      dragend: async () => {
        const m = ref.current;
        if (!m) return;
        const p = m.getLatLng();
        const ok = await confirmAction({
          title: "¿Guardar nueva ubicación?",
          text: `${o.customerName} · ${o.address}. Se usará también en los próximos pedidos de este cliente.`,
          confirmText: "Guardar ubicación",
        });
        if (!ok) {
          m.setLatLng([o.lat, o.lng]);
          return;
        }
        const res = await setOrderLocationAction({ orderId: o.id, lat: p.lat, lng: p.lng });
        if (res.ok) {
          toast.success("Ubicación guardada", `Pedido #${o.ref}`);
          router.refresh();
        } else {
          m.setLatLng([o.lat, o.lng]);
          toast.error("No se pudo guardar", res.error);
        }
      },
    }),
    [o, router],
  );

  return (
    <Marker
      ref={(m) => {
        ref.current = m;
        register(o.id, m);
      }}
      position={[o.lat, o.lng]}
      icon={icon}
      draggable={draggable}
      eventHandlers={handlers}
      title={`${o.customerName} · ${PIN_LABEL[o.status] ?? o.status}`}
      alt={`Pedido de ${o.customerName}`}
    >
      <Popup autoPanPaddingTopLeft={POPUP_PAD_TOP_LEFT} autoPanPaddingBottomRight={POPUP_PAD_BOTTOM_RIGHT}>
        <OrderPopup o={o} draggable={draggable} />
      </Popup>
    </Marker>
  );
}

function OrderPopup({ o, draggable }: { o: MapOrder; draggable: boolean }) {
  const color = PIN_COLOR[o.status] ?? "#64748b";
  return (
    <div className="space-y-1.5">
      <div className="flex items-start justify-between gap-3">
        <p className="font-semibold text-[var(--brand-deep)]">{o.customerName}</p>
        <span className="font-mono text-[10px] text-[#8a95a6]">#{o.ref}</span>
      </div>
      <p className="text-[#3d4a5c]">
        {o.address}
        {o.commune ? `, ${o.commune}` : ""}
      </p>
      {o.items ? <p className="text-xs text-[#5a6578]">{o.items}</p> : null}
      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
        <span
          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold text-white"
          style={{ background: color }}
        >
          {PIN_LABEL[o.status] ?? o.status}
        </span>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset",
            o.payment === "paid" ? "bg-emerald-50 text-emerald-800 ring-emerald-200" : "bg-amber-50 text-amber-800 ring-amber-200",
          )}
        >
          {o.payment === "paid" ? "Pagado" : "Pago pendiente"}
        </span>
        {o.routeStop ? <span className="text-[11px] text-[#5a6578]">Parada {o.routeStop}</span> : null}
      </div>
      <p className="text-xs text-[#5a6578]">
        {formatClp(o.totalClp)}
        {o.bottles ? ` · ${o.bottles} bidón(es)` : ""}
        {o.slot ? ` · ${o.slot === "manana" ? "AM" : "PM"}` : ""}
      </p>
      <div className="flex flex-wrap gap-2 pt-1">
        <Link
          href={`/admin/pedidos/${o.id}`}
          className="inline-flex items-center gap-1 rounded-md bg-[var(--brand)] px-2 py-1 text-xs font-semibold !text-white hover:opacity-90"
        >
          <ExternalLink className="size-3" /> Ver pedido
        </Link>
        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${o.lat},${o.lng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded-md border border-[#d5e3ec] px-2 py-1 text-xs font-medium !text-[#12233d] hover:border-[var(--brand)]"
        >
          <Navigation className="size-3" /> Cómo llegar
        </a>
      </div>
      {o.approx ? (
        <p className="rounded-md bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-800">
          Dirección no encontrada en el mapa. Activa «Corregir» y arrastra este pin a la ubicación real.
        </p>
      ) : null}
      {draggable ? <p className="pt-1 text-[11px] text-[#7b8aa0]">Arrastra el pin para corregir la ubicación.</p> : null}
      {o.geoSource === "manual" ? <p className="text-[11px] text-[#7b8aa0]">Ubicación corregida manualmente.</p> : null}
    </div>
  );
}

export type DispatchMapProps = {
  data: DispatchMapData;
  className?: string;
  /** Wheel zoom traps page scroll on the dashboard; enable it on the full-page map. */
  scrollZoom?: boolean;
};

export default function DispatchMap({ data, className, scrollZoom = false }: DispatchMapProps) {
  const [palette] = useState(themePalette);
  const [hidden, setHidden] = useState<Set<string>>(() => new Set());
  const [editing, setEditing] = useState(false);
  const [focusId, setFocusId] = useState<string | null>(null);
  const markers = useRef(new Map<string, L.Marker>());

  const visible = useMemo(() => data.orders.filter((o) => !hidden.has(o.status)), [data.orders, hidden]);
  const points = useMemo(() => visible.filter((o) => !o.approx).map((o) => [o.lat, o.lng] as LatLng), [visible]);
  const idsKey = useMemo(() => visible.map((o) => o.id).join(","), [visible]);
  const [map, setMap] = useState<L.Map | null>(null);
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const o of data.orders) c[o.status] = (c[o.status] ?? 0) + 1;
    return c;
  }, [data.orders]);

  useEffect(() => {
    const onFocus = (e: Event) => {
      const id = (e as CustomEvent<string>).detail;
      const m = markers.current.get(id);
      if (!m) {
        toast.info("Pedido sin ubicación en el mapa", "Usa «Ubicar pedidos» o revisa la dirección.");
        return;
      }
      setFocusId(id);
      if (!map) return;
      map.getContainer().scrollIntoView({ behavior: "smooth", block: "center" });
      map.flyTo(m.getLatLng(), Math.max(map.getZoom(), 15), { duration: 0.6 });
      window.setTimeout(() => m.openPopup(), 650);
    };
    window.addEventListener(MAP_FOCUS_EVENT, onFocus);
    return () => window.removeEventListener(MAP_FOCUS_EVENT, onFocus);
  }, [map]);

  const register = useMemo(
    () => (id: string, m: L.Marker | null) => {
      if (m) markers.current.set(id, m);
      else markers.current.delete(id);
    },
    [],
  );

  const routeColor = (i: number) => palette[i % palette.length];

  return (
    <div className={cn("mb-map relative overflow-hidden rounded-xl", className)}>
      <MapContainer
        ref={setMap}
        center={data.center}
        zoom={12}
        scrollWheelZoom={scrollZoom}
        zoomControl={false}
        className="h-full w-full"
        attributionControl
      >
        <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} maxZoom={19} />
        <ZoomControl position="bottomright" />
        <FitBounds points={points} center={data.center} idsKey={idsKey} />
        <ResizeWatcher />

        {data.routes.map((r) => {
          const color = routeColor(r.colorIndex);
          return r.stops.length > 1 ? (
            <Polyline
              key={`line-${r.id}`}
              positions={r.stops}
              pathOptions={{
                color,
                weight: 4,
                opacity: r.status === "completada" ? 0.45 : 0.85,
                dashArray: r.status === "planificada" ? "8 8" : undefined,
                lineJoin: "round",
              }}
            >
              <Tooltip sticky>
                {r.name} · {r.delivered}/{r.total} entregados
              </Tooltip>
            </Polyline>
          ) : null;
        })}

        {data.routes.map((r) =>
          r.trail.length > 1 ? (
            <Polyline
              key={`trail-${r.id}`}
              positions={r.trail}
              pathOptions={{ color: routeColor(r.colorIndex), weight: 3, opacity: 0.55, dashArray: "2 6", lineCap: "round" }}
            >
              <Tooltip sticky>Recorrido real de {r.driverName ?? r.name}</Tooltip>
            </Polyline>
          ) : null,
        )}

        {visible.map((o) => (
          <OrderMarker key={o.id} o={o} draggable={editing} focused={focusId === o.id} register={register} />
        ))}

        {data.routes.map((r) =>
          r.driverPos && r.driverName ? (
            <Marker
              key={`drv-${r.id}`}
              position={r.driverPos}
              icon={driverIcon(routeColor(r.colorIndex), r.driverLive)}
              zIndexOffset={500}
              title={`Chofer ${r.driverName}`}
            >
              <Popup autoPanPaddingTopLeft={POPUP_PAD_TOP_LEFT} autoPanPaddingBottomRight={POPUP_PAD_BOTTOM_RIGHT}>
                <p className="font-semibold text-[var(--brand-deep)]">{r.driverName}</p>
                <p className="text-xs text-[#5a6578]">{r.name}</p>
                <p className="mt-1 text-xs">
                  {r.delivered}/{r.total} entregas · {r.status === "en_ruta" ? "En ruta" : "Planificada"}
                </p>
                <p className="mt-1 text-[11px] text-[#7b8aa0]">
                  {r.driverLive && r.driverSeenAt
                    ? `GPS en vivo · ${agoLabel(r.driverSeenAt)}`
                    : r.driverSeenAt
                      ? `Sin señal GPS desde ${agoLabel(r.driverSeenAt)}. Posición estimada según la última entrega.`
                      : "Posición estimada según la última entrega. El chofer puede compartir su ubicación desde la vista Chofer."}
                </p>
              </Popup>
            </Marker>
          ) : null,
        )}
      </MapContainer>

        <div className="pointer-events-none absolute inset-x-2 top-2 z-[1000] flex items-start justify-between gap-2">
          <div className="pointer-events-auto flex max-w-[75%] flex-wrap gap-1 rounded-lg border border-[#d5e3ec] bg-white/95 p-1 shadow-sm">
            {PIN_STATUSES.filter((s) => counts[s]).map((s) => {
              const off = hidden.has(s);
              return (
                <button
                  key={s}
                  type="button"
                  aria-pressed={!off}
                  onClick={() =>
                    setHidden((prev) => {
                      const next = new Set(prev);
                      if (next.has(s)) next.delete(s);
                      else next.add(s);
                      return next;
                    })
                  }
                  className={cn(
                    "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium transition",
                    off ? "text-[#9aa5b5] line-through" : "text-[#12233d] hover:bg-[#f1f6f9]",
                  )}
                  title={off ? "Mostrar" : "Ocultar"}
                >
                  <span className="size-2.5 rounded-full" style={{ background: PIN_COLOR[s], opacity: off ? 0.35 : 1 }} />
                  {PIN_LABEL[s]} <span className="tabular-nums text-[#7b8aa0]">{counts[s]}</span>
                </button>
              );
            })}
            {data.orders.length === 0 ? <span className="px-1.5 py-0.5 text-[11px] text-[#5a6578]">Sin pedidos ubicados</span> : null}
          </div>
          <div className="flex gap-1">
            <button
              type="button"
              aria-pressed={editing}
              onClick={() => {
                setEditing((v) => !v);
                if (!editing) toast.info("Modo corrección activo", "Arrastra un pin para ajustar su ubicación.");
              }}
              className={cn(
                "pointer-events-auto inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium shadow-sm",
                editing
                  ? "border-[var(--brand)] bg-[var(--brand)] text-white"
                  : "border-[#d5e3ec] bg-white/95 text-[#12233d] hover:border-[var(--brand)]",
              )}
              title="Corregir ubicaciones arrastrando los pines"
            >
              <Move className="size-3.5" /> <span className="hidden sm:inline">{editing ? "Listo" : "Corregir"}</span>
            </button>
            <button
              type="button"
              onClick={() => map && fitTo(map, points, data.center)}
              className="pointer-events-auto inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#d5e3ec] bg-white/95 px-2.5 text-xs font-medium text-[#12233d] shadow-sm hover:border-[var(--brand)]"
              title="Ver todos los pedidos"
            >
              <Crosshair className="size-3.5" /> <span className="hidden sm:inline">Centrar</span>
            </button>
          </div>
        </div>

        {data.routes.length ? (
          <div className="pointer-events-none absolute bottom-6 left-2 z-[1000] hidden max-w-[60%] flex-col gap-0.5 rounded-lg border border-[#d5e3ec] bg-white/95 px-2 py-1.5 shadow-sm sm:flex">
            {data.routes.map((r) => (
              <span key={r.id} className="flex items-center gap-1.5 truncate text-[11px] text-[#12233d]">
                <span
                  className="h-1 w-4 shrink-0 rounded-full"
                  style={{ background: routeColor(r.colorIndex), opacity: r.status === "completada" ? 0.5 : 1 }}
                />
                <span className="truncate">
                  {r.name}
                  {r.driverName ? ` · ${r.driverName}` : ""}
                </span>
              </span>
            ))}
          </div>
        ) : null}
    </div>
  );
}
