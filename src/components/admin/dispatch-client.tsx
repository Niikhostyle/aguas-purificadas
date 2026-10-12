"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import { ChevronUp, Search, X } from "lucide-react";

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Instant client-side search over server-rendered rows. Rows carry
 * `data-filter-text`; groups (`data-filter-group`) hide when all their rows do.
 */
export function ListQuickFilter({ scope, placeholder }: { scope: string; placeholder: string }) {
  const id = useId();
  const [q, setQ] = useState("");
  const [shown, setShown] = useState<number | null>(null);

  useEffect(() => {
    const root = document.getElementById(scope);
    if (!root) return;
    const needle = normalize(q.trim());
    let visible = 0;
    root.querySelectorAll<HTMLElement>("[data-filter-text]").forEach((row) => {
      const match = !needle || normalize(row.dataset.filterText ?? "").includes(needle);
      row.hidden = !match;
      if (match) visible++;
    });
    root.querySelectorAll<HTMLElement>("[data-filter-group]").forEach((group) => {
      group.hidden = Boolean(needle) && !group.querySelector("[data-filter-text]:not([hidden])");
    });
    // eslint-disable-next-line react-hooks/set-state-in-effect -- count comes from the DOM rows just filtered
    setShown(needle ? visible : null);
  }, [q, scope]);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative w-full sm:max-w-xs">
        <label htmlFor={id} className="sr-only">
          Buscar en la lista
        </label>
        <Search aria-hidden className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-[#7b8aa0]" />
        <input
          id={id}
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={placeholder}
          className="h-9 w-full rounded-lg border border-[#d5e3ec] bg-white pl-8 pr-8 text-sm placeholder:text-[#8a96a6] focus:border-[var(--brand)] focus:outline-none focus:ring-3 focus:ring-[var(--brand)]/20"
        />
        {q ? (
          <button
            type="button"
            onClick={() => setQ("")}
            aria-label="Limpiar búsqueda"
            className="absolute right-1.5 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded text-[#7b8aa0] hover:bg-[#eef3f7]"
          >
            <X aria-hidden className="size-3.5" />
          </button>
        ) : null}
      </div>
      <p aria-live="polite" className="text-xs text-[#5a6578]">
        {shown === null ? "" : shown === 1 ? "1 resultado" : `${shown} resultados`}
      </p>
    </div>
  );
}

/** Sticky bulk-action bar that collapses to a summary on small screens. */
export function BulkBar({ formId, children }: { formId: string; children: ReactNode }) {
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);
  const panelId = useId();

  useEffect(() => {
    const recount = () =>
      setCount(
        document.querySelectorAll(`input[type=checkbox][form="${formId}"][name="orderIds"]:checked`).length,
      );
    recount();
    document.addEventListener("change", recount);
    return () => document.removeEventListener("change", recount);
  }, [formId]);

  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 rounded-lg py-1 text-left text-sm font-semibold text-[var(--brand-deep)] md:hidden"
      >
        <span>
          Acciones de selección{" "}
          <span className="ml-1 rounded-full bg-[var(--brand)] px-2 py-0.5 text-xs text-white tabular-nums">{count}</span>
        </span>
        <ChevronUp aria-hidden className={`size-4 transition-transform ${open ? "" : "rotate-180"}`} />
      </button>
      <div id={panelId} className={`${open ? "mt-2 flex" : "hidden"} flex-wrap items-center justify-center gap-2 md:mt-0 md:flex`}>
        <span className="hidden text-xs font-semibold uppercase tracking-wide text-[#5a6578] md:inline">
          Selección <span className="tabular-nums text-[var(--brand-deep)]">({count})</span>
        </span>
        {children}
      </div>
    </div>
  );
}
