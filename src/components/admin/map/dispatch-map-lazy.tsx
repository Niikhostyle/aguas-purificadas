"use client";

import dynamic from "next/dynamic";
import { MapPin } from "lucide-react";
import type { DispatchMapProps } from "./dispatch-map";

/** Leaflet touches `window` on import, so the map only ever renders on the client. */
const DispatchMap = dynamic(() => import("./dispatch-map"), {
  ssr: false,
  loading: () => (
    <div className="mb-skeleton grid h-full w-full place-items-center rounded-xl">
      <MapPin aria-hidden className="size-6 text-[#9fb3c4]" />
      <span className="sr-only">Cargando mapa…</span>
    </div>
  ),
});

export function LazyDispatchMap(props: DispatchMapProps) {
  return <DispatchMap {...props} />;
}

/** Quick action for tables: flies the map to an order and opens its popup. */
export function FocusOnMapButton({ orderId, className, children }: { orderId: string; className?: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => window.dispatchEvent(new CustomEvent("dispatch-map:focus", { detail: orderId }))}
      title="Ver en el mapa"
    >
      {children}
    </button>
  );
}
