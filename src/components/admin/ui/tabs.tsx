"use client";

import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type TabItem = { id: string; label: ReactNode; content: ReactNode };

/** Accessible tabs (arrow keys move between tabs). Panels stay mounted so server content isn't refetched. */
export function Tabs({ items, className, label }: { items: TabItem[]; className?: string; label: string }) {
  const [active, setActive] = useState(items[0]?.id);
  const base = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const delta = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    const target = e.key === "Home" ? 0 : e.key === "End" ? items.length - 1 : delta ? (i + delta + items.length) % items.length : -1;
    if (target < 0) return;
    e.preventDefault();
    setActive(items[target].id);
    refs.current[target]?.focus();
  };

  return (
    <div className={className}>
      <div role="tablist" aria-label={label} className="flex gap-1 overflow-x-auto border-b border-[#e8f0f5] px-3">
        {items.map((t, i) => {
          const selected = t.id === active;
          return (
            <button
              key={t.id}
              ref={(el) => {
                refs.current[i] = el;
              }}
              role="tab"
              type="button"
              id={`${base}-tab-${t.id}`}
              aria-selected={selected}
              aria-controls={`${base}-panel-${t.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(t.id)}
              onKeyDown={(e) => onKey(e, i)}
              className={cn(
                "-mb-px whitespace-nowrap border-b-2 px-3 py-3 text-sm font-medium transition",
                selected
                  ? "border-[var(--brand)] text-[var(--brand-deep)]"
                  : "border-transparent text-[#5a6578] hover:text-[var(--brand-deep)]",
              )}
            >
              {t.label}
            </button>
          );
        })}
      </div>
      {items.map((t) => (
        <div
          key={t.id}
          role="tabpanel"
          id={`${base}-panel-${t.id}`}
          aria-labelledby={`${base}-tab-${t.id}`}
          hidden={t.id !== active}
        >
          {t.content}
        </div>
      ))}
    </div>
  );
}
