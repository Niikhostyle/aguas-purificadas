"use client";

import { MapPin, X } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { RegionOption } from "@/lib/modules";

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
    if (autoOpen && regions.length && !readRegionCookie() && !wasDismissed()) {
      setOpen(true);
    }
    window.addEventListener(SYNC_EVENT, sync);
    return () => window.removeEventListener(SYNC_EVENT, sync);
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
        className="absolute inset-0 bg-[#051b3f]/55 backdrop-blur-[2px] animate-in fade-in duration-200"
        onClick={() => close(true)}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="relative flex outline-none max-h-[85dvh] w-full flex-col rounded-t-3xl bg-white shadow-2xl animate-in slide-in-from-bottom-8 fade-in duration-300 sm:max-h-[min(640px,85dvh)] sm:max-w-md sm:rounded-2xl sm:slide-in-from-bottom-0 sm:zoom-in-95"
      >
        <div className="mx-auto mt-2.5 h-1.5 w-10 rounded-full bg-[#d5e3ec] sm:hidden" aria-hidden />
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
            className="-mr-2 inline-flex size-10 shrink-0 items-center justify-center rounded-full text-[#5a6578] transition hover:bg-[var(--mist)] hover:text-[var(--brand-deep)] focus-visible:outline-2 focus-visible:outline-[var(--brand)]"
          >
            <X className="size-5" />
          </button>
        </div>

        {regions.length > 6 ? (
          <div className="px-6 pt-2">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar ciudad o región"
              aria-label="Buscar ciudad o región"
              className="w-full rounded-lg border border-[#d5e3ec] px-3 py-2 text-sm outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/20"
            />
          </div>
        ) : null}

        <ul className="mt-3 flex-1 space-y-2 overflow-y-auto overscroll-contain px-6 pb-2">
          {visible.map((r) => {
            const active = selected?.id === r.id;
            return (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => choose(r)}
                  data-autofocus={active || undefined}
                  aria-pressed={active}
                  className={`flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition hover:border-[var(--brand)] hover:bg-[var(--mist)] focus-visible:outline-2 focus-visible:outline-[var(--brand)] ${
                    active ? "border-[var(--brand)] bg-[var(--mist)]" : "border-[#d5e3ec]"
                  }`}
                >
                  <span className="flex items-center gap-2 font-semibold text-[var(--brand-deep)]">
                    <MapPin className="size-4 shrink-0 text-[var(--brand)]" aria-hidden />
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

        <div className="border-t border-[#e8f0f5] px-6 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={() => close(true)}
            className="w-full rounded-lg py-2 text-sm font-semibold text-[#5a6578] hover:text-[var(--brand)]"
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
        className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-[#d5e3ec] px-2.5 py-1.5 text-xs font-bold uppercase tracking-wide text-[var(--brand-deep)] transition hover:border-[var(--brand)] hover:text-[var(--brand)] ${className}`}
      >
        <MapPin className="size-3.5 text-[var(--brand)]" aria-hidden />
        <span className="max-w-[10rem] truncate">{selected ? selected.name : "Elige tu ciudad"}</span>
      </button>
      {portalTarget && open ? createPortal(dialog, portalTarget) : null}
    </>
  );
}
