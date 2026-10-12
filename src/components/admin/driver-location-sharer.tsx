"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LocateFixed, LocateOff, Radio } from "lucide-react";
import { reportDriverPositionAction, stopDriverSharingAction } from "@/app/admin/(panel)/despacho/tracking-actions";
import { distanceMeters } from "@/lib/live-tracking";
import { cn } from "@/lib/utils";

const SEND_EVERY_MS = 15_000;
const SEND_IF_MOVED_M = 30;

type WakeLockSentinelLike = { release: () => Promise<void> };

/**
 * Sends the phone's GPS position for a route while the driver keeps this page open.
 * Browsers stop geolocation when the screen locks, so it also holds a screen wake lock.
 */
export function DriverLocationSharer({ routeId, routeName }: { routeId: string; routeName: string }) {
  const storageKey = `mibidon:compartir:${routeId}`;
  const [sharing, setSharing] = useState(false);
  const [lastSent, setLastSent] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(0);
  const watchId = useRef<number | null>(null);
  const wakeLock = useRef<WakeLockSentinelLike | null>(null);
  const last = useRef<{ at: number; pos: [number, number] } | null>(null);
  const inFlight = useRef(false);

  const acquireWakeLock = useCallback(async () => {
    const nav = navigator as Navigator & { wakeLock?: { request: (t: "screen") => Promise<WakeLockSentinelLike> } };
    try {
      wakeLock.current = (await nav.wakeLock?.request("screen")) ?? null;
    } catch {
      wakeLock.current = null;
    }
  }, []);

  const stopWatching = useCallback(() => {
    if (watchId.current != null) navigator.geolocation.clearWatch(watchId.current);
    watchId.current = null;
    void wakeLock.current?.release().catch(() => {});
    wakeLock.current = null;
  }, []);

  const start = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setError("Este teléfono no permite compartir la ubicación desde el navegador.");
      return;
    }
    setError(null);
    setSharing(true);
    localStorage.setItem(storageKey, "1");
    void acquireWakeLock();
    watchId.current = navigator.geolocation.watchPosition(
      async (p) => {
        const pos: [number, number] = [p.coords.latitude, p.coords.longitude];
        const now = Date.now();
        const prev = last.current;
        if (inFlight.current) return;
        if (prev && now - prev.at < SEND_EVERY_MS && distanceMeters(prev.pos, pos) < SEND_IF_MOVED_M) return;
        inFlight.current = true;
        try {
          const res = await reportDriverPositionAction({
            routeId,
            lat: pos[0],
            lng: pos[1],
            accuracy: Number.isFinite(p.coords.accuracy) ? p.coords.accuracy : null,
            heading: p.coords.heading != null && Number.isFinite(p.coords.heading) ? p.coords.heading : null,
          });
          if (res.ok) {
            last.current = { at: now, pos };
            setLastSent(now);
            setError(null);
          } else {
            setError(res.error);
          }
        } catch {
          setError("Sin conexión. Reintentaremos con la próxima señal.");
        } finally {
          inFlight.current = false;
        }
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setError("Permiso de ubicación denegado. Actívalo en los ajustes del navegador para esta página.");
          setSharing(false);
          localStorage.removeItem(storageKey);
          stopWatching();
        } else {
          setError("No logramos obtener la señal GPS. Revisa que la ubicación del teléfono esté activa.");
        }
      },
      { enableHighAccuracy: true, maximumAge: 10_000, timeout: 30_000 },
    );
  }, [acquireWakeLock, routeId, stopWatching, storageKey]);

  const stop = useCallback(async () => {
    stopWatching();
    setSharing(false);
    localStorage.removeItem(storageKey);
    last.current = null;
    setLastSent(null);
    await stopDriverSharingAction(routeId).catch(() => {});
  }, [routeId, stopWatching, storageKey]);

  useEffect(() => {
    const resume = window.setTimeout(() => {
      if (localStorage.getItem(storageKey) === "1") start();
    }, 0);
    return () => {
      window.clearTimeout(resume);
      stopWatching();
    };
  }, [start, stopWatching, storageKey]);

  useEffect(() => {
    if (!sharing) return;
    const onVisible = () => {
      if (document.visibilityState === "visible") void acquireWakeLock();
    };
    document.addEventListener("visibilitychange", onVisible);
    const t = window.setInterval(() => setNow(Date.now()), 5_000);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.clearInterval(t);
    };
  }, [acquireWakeLock, sharing]);

  const secondsAgo = lastSent ? Math.max(0, Math.round((Math.max(now, lastSent) - lastSent) / 1000)) : null;

  return (
    <section
      className={cn(
        "mt-4 rounded-2xl border p-4",
        sharing ? "border-emerald-200 bg-emerald-50" : "border-[#d5e3ec] bg-white",
      )}
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "grid size-10 shrink-0 place-items-center rounded-full",
            sharing ? "bg-emerald-600 text-white" : "bg-[#e6f7fc] text-[var(--brand)]",
          )}
        >
          <Radio className={cn("size-5", sharing && "animate-pulse")} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-[var(--brand-deep)]">
            {sharing ? "Compartiendo ubicación en vivo" : "Ubicación en vivo"}
          </p>
          <p className="text-sm text-[#5a6578]">
            {sharing
              ? secondsAgo == null
                ? "Buscando señal GPS…"
                : `Última señal enviada hace ${secondsAgo < 10 ? "unos segundos" : `${secondsAgo} s`}.`
              : `Tus clientes de «${routeName}» verán el camión acercarse y el panel mostrará tu recorrido.`}
          </p>
        </div>
      </div>
      {error ? <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">{error}</p> : null}
      <button
        type="button"
        onClick={sharing ? stop : start}
        className={cn(
          "mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-xl text-base font-semibold",
          sharing
            ? "border border-emerald-300 bg-white text-emerald-800"
            : "bg-[var(--brand)] text-white shadow-sm hover:opacity-95",
        )}
      >
        {sharing ? <LocateOff className="size-5" /> : <LocateFixed className="size-5" />}
        {sharing ? "Dejar de compartir" : "Compartir mi ubicación"}
      </button>
      {sharing ? (
        <p className="mt-2 text-xs text-emerald-900/80">
          Mantén esta pantalla abierta mientras repartes. Si bloqueas el teléfono o cambias de app, la ubicación se
          pausa hasta que vuelvas.
        </p>
      ) : null}
    </section>
  );
}
