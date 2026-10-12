"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { CircleCheck, Clock, MapPin, Truck } from "lucide-react";
import { agoLabel, type OrderTracking } from "@/lib/live-tracking";
import { cn } from "@/lib/utils";

const OrderTrackingMap = dynamic(() => import("./order-tracking-map"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-[var(--mist)]" />,
});

const STEPS = [
  { key: "recibido", label: "Recibido" },
  { key: "programado", label: "Programado" },
  { key: "en_ruta", label: "En camino" },
  { key: "entregado", label: "Entregado" },
] as const;

function stepIndex(fulfillment: string): number {
  if (fulfillment === "entregado") return 3;
  if (fulfillment === "en_ruta") return 2;
  if (fulfillment === "programado") return 1;
  return 0;
}

export function OrderLiveTracking({ orderId, initial }: { orderId: string; initial: OrderTracking }) {
  const [t, setT] = useState(initial);
  const [, tick] = useState(0);

  useEffect(() => {
    if (t.fulfillment === "entregado") return;
    const every = t.fulfillment === "en_ruta" ? 15_000 : 60_000;
    let cancelled = false;
    const id = window.setInterval(async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const res = await fetch(`/api/pedido/${orderId}/seguimiento`, { cache: "no-store" });
        if (res.ok && !cancelled) setT(await res.json());
      } catch {
        /* keep the last known state */
      }
      tick((n) => n + 1);
    }, every);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [orderId, t.fulfillment]);

  const current = stepIndex(t.fulfillment);
  const failed = t.fulfillment === "no_entregado";
  const showMap = t.fulfillment === "en_ruta" && t.driver;

  return (
    <section className="sf-enter sf-card mt-8 overflow-hidden" aria-live="polite">
      <div className="p-6">
        <p className="flex items-center gap-2 text-sm font-semibold text-[var(--brand-deep)]">
          <Truck className="size-4 text-[var(--brand)]" /> Seguimiento del despacho
        </p>
        {failed ? (
          <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
            No pudimos entregar tu pedido en esta vuelta. La empresa te contactará para coordinar una nueva entrega.
          </p>
        ) : (
          <ol className="mt-4 grid grid-cols-4 gap-2">
            {STEPS.map((s, i) => (
              <li key={s.key} className="flex flex-col items-center gap-1.5 text-center">
                <span
                  className={cn(
                    "grid size-8 place-items-center rounded-full text-xs font-bold transition",
                    i < current && "bg-[var(--brand)] text-white",
                    i === current && "bg-[var(--brand-deep)] text-white ring-4 ring-[var(--mist)]",
                    i > current && "bg-[var(--mist)] text-[#8a95a6]",
                  )}
                >
                  {i < current || t.fulfillment === "entregado" ? <CircleCheck className="size-4" /> : i + 1}
                </span>
                <span className={cn("text-xs", i <= current ? "font-semibold text-[var(--brand-deep)]" : "text-[#8a95a6]")}>
                  {s.label}
                </span>
              </li>
            ))}
          </ol>
        )}

        {t.fulfillment === "en_ruta" ? (
          <div className="mt-5 rounded-xl bg-[var(--mist)] px-4 py-3 text-sm text-[var(--brand-deep)]">
            {t.driver?.live && t.etaMin != null ? (
              <p className="flex items-center gap-2 font-semibold">
                <Clock className="size-4" /> Llegada estimada: unos {t.etaMin} min
              </p>
            ) : (
              <p className="flex items-center gap-2 font-semibold">
                <Truck className="size-4" /> Tu pedido va en camino
              </p>
            )}
            <p className="mt-1 text-[#5a6578]">
              {t.stopsBefore > 0
                ? `Hay ${t.stopsBefore} entrega${t.stopsBefore === 1 ? "" : "s"} antes de la tuya.`
                : "Eres la próxima entrega."}
              {t.driverName ? ` Te lleva ${t.driverName}.` : ""}
            </p>
            {t.driver && !t.driver.live ? (
              <p className="mt-1 text-xs text-[#8a95a6]">Última ubicación del camión {agoLabel(t.driver.seenAt)}.</p>
            ) : null}
          </div>
        ) : null}

        {t.fulfillment === "entregado" ? (
          <p className="mt-5 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
            <CircleCheck className="size-4" /> Pedido entregado
            {t.deliveredAt
              ? ` el ${new Date(t.deliveredAt).toLocaleString("es-CL", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Santiago" })}`
              : ""}
          </p>
        ) : null}
      </div>

      {showMap ? (
        <div className="relative h-72 border-t border-[var(--sf-line)] md:h-80">
          <OrderTrackingMap driver={t.driver!.pos} live={t.driver!.live} destination={t.destination} />
          <span className="pointer-events-none absolute left-3 top-3 z-[1000] inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-[var(--brand-deep)] shadow-sm">
            {t.driver!.live ? (
              <>
                <span className="size-2 animate-pulse rounded-full bg-emerald-500" /> En vivo
              </>
            ) : (
              <>
                <MapPin className="size-3" /> Sin señal reciente
              </>
            )}
          </span>
        </div>
      ) : null}
    </section>
  );
}
