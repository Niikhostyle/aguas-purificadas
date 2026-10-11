"use client";

import { useEffect, useState } from "react";
import type { RegionOption } from "@/lib/modules";

const COOKIE = "mibidon_region";

function writeRegionCookie(id: string) {
  document.cookie = `${COOKIE}=${encodeURIComponent(id)}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
}

export function RegionSelector({ regions }: { regions: RegionOption[] }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<RegionOption | null>(null);

  useEffect(() => {
    const match = document.cookie.match(
      new RegExp(`(?:^|; )${COOKIE}=([^;]*)`),
    );
    const id = match ? decodeURIComponent(match[1]) : "";
    const found = regions.find((r) => r.id === id) || null;
    // Cookie is only readable after hydration, so it must sync in an effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelected(found);
    if (!found && regions.length) setOpen(true);
  }, [regions]);

  const choose = (r: RegionOption) => {
    writeRegionCookie(r.id);
    setSelected(r);
    setOpen(false);
  };

  if (!regions.length) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[var(--brand-deep)] hover:text-[var(--brand)]"
      >
        <span aria-hidden className="text-[var(--brand)]">
          ◈
        </span>
        {selected ? selected.name : "Elegí tu ciudad"}
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-[#051b3f]/45 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="region-title"
        >
          <div className="w-full max-w-md animate-in fade-in zoom-in-95 rounded-2xl bg-white p-6 shadow-xl">
            <h2
              id="region-title"
              className="rc-display text-2xl uppercase text-[var(--brand-deep)]"
            >
              ¿Dónde te despachamos?
            </h2>
            <p className="mt-2 text-sm text-[#5a6578]">
              Seleccioná tu ciudad o zona para ver cobertura y ofertas locales.
            </p>
            <ul className="mt-5 max-h-72 space-y-2 overflow-y-auto">
              {regions.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => choose(r)}
                    className="flex w-full items-center justify-between rounded-lg border border-[#d5e3ec] px-4 py-3 text-left transition hover:border-[var(--brand)] hover:bg-[#e8f7fc]"
                  >
                    <span className="font-semibold text-[var(--brand-deep)]">
                      {r.name}
                    </span>
                    {r.zone ? (
                      <span className="text-xs text-[#5a6578]">{r.zone}</span>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-4 w-full text-sm font-semibold text-[#5a6578] hover:text-[var(--brand)]"
            >
              {selected ? "Cerrar" : "Ahora no"}
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
