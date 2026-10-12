"use client";

import { useId, useState, type ReactNode } from "react";
import { SlidersHorizontal } from "lucide-react";

/**
 * Hides secondary filter fields behind a toggle below md; on larger screens the
 * children render inline (`display: contents`) so they keep the parent grid.
 */
export function MobileCollapse({
  label = "Más filtros",
  activeCount = 0,
  children,
}: {
  label?: string;
  activeCount?: number;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-[#d5e3ec] bg-white px-3 text-sm font-medium text-[var(--brand-deep)] hover:bg-[#f4f8fb] focus-visible:outline-2 focus-visible:outline-[var(--brand)] md:hidden"
      >
        <SlidersHorizontal aria-hidden className="size-4" />
        {open ? "Ocultar filtros" : label}
        {activeCount ? (
          <span className="rounded-full bg-[var(--brand)] px-1.5 text-xs text-white tabular-nums">{activeCount}</span>
        ) : null}
      </button>
      <div id={id} className={`${open ? "contents" : "hidden"} md:contents`}>
        {children}
      </div>
    </>
  );
}
