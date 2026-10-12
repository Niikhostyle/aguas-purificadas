"use client";

import { LoaderCircle, LocateFixed, MapPin, X } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { RegionOption } from "@/lib/modules";
import { type DetectedPlace, matchRegion, placeLabel } from "@/lib/region-match";

const COOKIE = "mibidon_region";
const DISMISSED_KEY = "mibidon_region_dismissed";
const SYNC_EVENT = "mibidon:region";

function readRegionCookie(): string {
  const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : "";
}

function writeRegionCookie(id: string) {
  document.cookie = `${COOKIE}=${encodeURIComponent(id)}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
}

function wasDismissed(): boolean {
  try {
    return window.localStorage.getItem(DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

function rememberDismissed() {
  try {
    window.localStorage.setItem(DISMISSED_KEY, "1");
  } catch {
    /* private mode: the modal may simply show again next visit */
  }
}

async function fetchPlace(coords?: { lat: number; lng: number }): Promise<DetectedPlace | null> {
  const qs = coords ? `?lat=${coords.lat.toFixed(5)}&lng=${coords.lng.toFixed(5)}` : "";
  try {
    const res = await fetch(`/api/geo/region${qs}`, { cache: "no-store" });
    if (!res.ok) return null;
    const body = (await res.json()) as { place?: DetectedPlace | null };
    return body.place ?? null;
  } catch {
    return null;
  }
}

function currentPosition(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) return reject(new Error("unsupported"));
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      reject,
      { enableHighAccuracy: false, timeout: 12_000, maximumAge: 10 * 60_000 },
    );
  });
}

type Suggestion = { region: RegionOption; place: DetectedPlace };

const FOCUSABLE = 'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';

export function RegionSelector({
  regions,
  autoOpen = false,
  className = "",
}: {
  regions: RegionOption[];
  /** Only one instance per page should auto-open on first visit. */
  autoOpen?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const [selected, setSelected] = useState<RegionOption | null>(null);
  const [query, setQuery] = useState("");
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [locating, setLocating] = useState(false);
  const [locateNote, setLocateNote] = useState<string | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    const sync = () => {
      const id = readRegionCookie();
      setSelected(regions.find((r) => r.id === id) || null);
    };
    // Cookie / localStorage are only readable after hydration, so they sync in an effect.
    // The dialog must render outside the header (its backdrop-blur traps position:fixed)
    // but inside [data-storefront], where the tenant theme variables live.
    setPortalTarget(
      triggerRef.current?.closest<HTMLElement>("[data-storefront]") ?? document.body,
    );
    sync();
    let cancelled = false;
    if (autoOpen && regions.length && !readRegionCookie()) {
      if (!wasDismissed()) setOpen(true);
      void fetchPlace().then((place) => {
        const region = place ? matchRegion(regions, place) : null;
        if (!cancelled && place && region) setSuggestion({ region, place });
      });
    }
    window.addEventListener(SYNC_EVENT, sync);
    return () => {
      cancelled = true;
      window.removeEventListener(SYNC_EVENT, sync);
    };
  }, [regions, autoOpen]);

  const close = useCallback((remember: boolean) => {
    if (remember) rememberDismissed();
    setOpen(false);
    setQuery("");
    triggerRef.current?.focus({ preventScroll: true });
  }, []);

  const choose = (r: RegionOption) => {
    writeRegionCookie(r.id);
    setSelected(r);
    window.dispatchEvent(new Event(SYNC_EVENT));
    close(false);
  };

  const locate = async () => {
    setLocating(true);
    setLocateNote(null);
    try {
      const place = await fetchPlace(await currentPosition());
      const region = place ? matchRegion(regions, place) : null;
      if (place && region) {
        choose(region);
      } else if (place) {
        setLocateNote(`Estás en ${placeLabel(place)}, que aún no aparece en la lista. Elige la zona más cercana.`);
      } else {
        setLocateNote("No pudimos reconocer tu ubicación. Elige tu ciudad en la lista.");
      }
    } catch (err) {
      const denied = (err as GeolocationPositionError | undefined)?.code === 1;
      setLocateNote(
        denied
          ? "No diste permiso de ubicación. Puedes elegir tu ciudad en la lista."
          : "No pudimos obtener tu ubicación. Elige tu ciudad en la lista.",
      );
    } finally {
      setLocating(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const panel = panelRef.current;
    (panel?.querySelector<HTMLElement>("[data-autofocus]") ?? panel)?.focus({ preventScroll: true });

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close(true);
        return;
      }
      if (e.key !== "Tab" || !panel) return;
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (!items.length) return;
      const firstEl = items[0];
      const lastEl = items[items.length - 1];
      if (e.shiftKey && (document.activeElement === firstEl || document.activeElement === panel)) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  if (!regions.length) return null;

  const q = query.trim().toLowerCase();
  const visible = q
    ? regions.filter((r) => `${r.name} ${r.zone ?? ""}`.toLowerCase().includes(q))
    : regions;

  const dialog = (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-6">
      <div
        aria-hidden
        className="absolute inset-0 bg-[#051b3f]/50 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={() => close(true)}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="relative flex outline-none max-h-[85dvh] w-full flex-col rounded-t-[1.75rem] bg-white shadow-[0_30px_80px_-20px_rgba(5,27,63,0.5)] ring-1 ring-black/5 animate-in slide-in-from-bottom-10 fade-in duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] sm:max-h-[min(640px,85dvh)] sm:max-w-md sm:rounded-[1.75rem] sm:slide-in-from-bottom-4 sm:zoom-in-95"
      >
        <div className="mx-auto mt-2.5 h-1.5 w-10 rounded-full bg-[var(--sf-line-strong)] sm:hidden" aria-hidden />
        <div className="flex items-start justify-between gap-4 px-6 pb-2 pt-4 sm:pt-6">
          <div>
            <h2 id={titleId} className="rc-display text-2xl uppercase text-[var(--brand-deep)]">
              ¿Dónde te despachamos?
            </h2>
            <p className="mt-1 text-sm text-[#5a6578]">
              Elige tu ciudad o zona para ver cobertura y ofertas locales.
            </p>
          </div>
          <button
            type="button"
            onClick={() => close(true)}
            aria-label="Cerrar"
            className="-mr-2 inline-flex size-10 shrink-0 items-center justify-center rounded-full text-[#5a6578] transition duration-300 hover:rotate-90 hover:bg-[var(--mist)] hover:text-[var(--brand-deep)] focus-visible:outline-2 focus-visible:outline-[var(--brand)]"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="space-y-2 px-6 pt-2">
          {suggestion && !selected ? (
            <button
              type="button"
              onClick={() => choose(suggestion.region)}
              className="flex w-full items-center justify-between gap-3 rounded-2xl border border-[var(--brand)] bg-[color-mix(in_srgb,var(--brand)_8%,#fff)] px-4 py-3 text-left transition duration-300 hover:shadow-[var(--sf-shadow-md)] active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-[var(--brand)]"
            >
              <span className="min-w-0">
                <span className="block text-xs text-[#5a6578]">
                  Parece que estás en {placeLabel(suggestion.place)}
                </span>
                <span className="block truncate font-semibold text-[var(--brand-deep)]">
                  Despachar a {suggestion.region.name}
                </span>
              </span>
              <span className="shrink-0 rounded-full bg-[var(--brand)] px-3 py-1 text-xs font-bold text-white">
                Confirmar
              </span>
            </button>
          ) : null}
          <button
            type="button"
            onClick={locate}
            disabled={locating}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[var(--sf-line-strong)] py-2.5 text-sm font-semibold text-[var(--brand-deep)] transition hover:border-[var(--brand)] hover:text-[var(--brand)] disabled:opacity-70"
          >
            {locating ? (
              <LoaderCircle className="size-4 animate-spin" aria-hidden />
            ) : (
              <LocateFixed className="size-4 text-[var(--brand)]" aria-hidden />
            )}
            {locating ? "Buscando tu ubicación…" : "Usar mi ubicación actual"}
          </button>
          {locateNote ? (
            <p role="status" className="text-center text-xs text-[#5a6578]">
              {locateNote}
            </p>
          ) : null}
        </div>

        {regions.length > 6 ? (
          <div className="px-6 pt-2">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar ciudad o región"
              aria-label="Buscar ciudad o región"
              className="h-11 w-full rounded-full border border-[var(--sf-line-strong)] px-4 text-sm outline-none transition focus:border-[var(--brand)] focus:ring-4 focus:ring-[var(--brand)]/15"
            />
          </div>
        ) : null}

        <ul className="mt-3 flex-1 space-y-2 overflow-y-auto overscroll-contain px-6 pb-2">
          {visible.map((r, i) => {
            const active = selected?.id === r.id;
            return (
              <li key={r.id} className="sf-enter" style={{ animationDelay: `${120 + Math.min(i, 8) * 40}ms` }}>
                <button
                  type="button"
                  onClick={() => choose(r)}
                  data-autofocus={active || undefined}
                  aria-pressed={active}
                  className={`group flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition duration-300 hover:border-[var(--brand)] hover:bg-[var(--mist)] hover:shadow-[var(--sf-shadow-md)] active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-[var(--brand)] ${
                    active
                      ? "border-[var(--brand)] bg-[var(--mist)] ring-1 ring-[var(--brand)]"
                      : "border-[var(--sf-line-strong)]"
                  }`}
                >
                  <span className="flex items-center gap-2 font-semibold text-[var(--brand-deep)]">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--brand)_12%,#fff)] text-[var(--brand)] transition-transform duration-300 group-hover:scale-110">
                      <MapPin className="size-4" aria-hidden />
                    </span>
                    {r.name}
                  </span>
                  {r.zone ? <span className="text-xs text-[#5a6578]">{r.zone}</span> : null}
                </button>
              </li>
            );
          })}
          {!visible.length ? (
            <li className="py-6 text-center text-sm text-[#5a6578]">Sin resultados para “{query}”.</li>
          ) : null}
        </ul>

        <div className="border-t border-[var(--sf-line)] px-6 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={() => close(true)}
            className="w-full rounded-full py-2.5 text-sm font-semibold text-[#5a6578] transition hover:bg-[var(--mist)] hover:text-[var(--brand)]"
          >
            {selected ? "Cerrar" : "Ahora no"}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-[var(--sf-line-strong)] bg-white/70 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-[var(--brand-deep)] shadow-[var(--sf-shadow-sm)] transition duration-300 hover:border-[var(--brand)] hover:text-[var(--brand)] active:scale-95 ${className}`}
      >
        <MapPin className="size-3.5 text-[var(--brand)]" aria-hidden />
        <span className="max-w-[10rem] truncate">{selected ? selected.name : "Elige tu ciudad"}</span>
      </button>
      {portalTarget && open ? createPortal(dialog, portalTarget) : null}
    </>
  );
}
