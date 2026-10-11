"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, type ReactNode } from "react";
import { Search, X } from "lucide-react";
import { adminButton } from "./button-styles";

export type FilterSelect = {
  name: string;
  label: string;
  value?: string;
  options: { value: string; label: string }[];
};

/**
 * GET form so filters live in the URL, work without JS and are shareable.
 * Selects auto-submit when JS is available.
 */
export function FilterBar({
  q,
  searchPlaceholder = "Buscar…",
  selects = [],
  actions,
  hidden,
}: {
  q?: string;
  searchPlaceholder?: string;
  selects?: FilterSelect[];
  actions?: ReactNode;
  /** Extra query params to preserve (e.g. a tab). */
  hidden?: Record<string, string>;
}) {
  const pathname = usePathname();
  const formRef = useRef<HTMLFormElement>(null);
  const active = Boolean(q) || selects.some((s) => s.value && s.value !== "all");

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <form ref={formRef} method="get" role="search" className="flex flex-1 flex-wrap items-center gap-2">
        {hidden
          ? Object.entries(hidden).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)
          : null}
        <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
          <label htmlFor="filter-q" className="sr-only">
            Buscar
          </label>
          <Search
            aria-hidden
            className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-[#7b8aa0]"
          />
          <input
            id="filter-q"
            name="q"
            type="search"
            defaultValue={q}
            placeholder={searchPlaceholder}
            className="h-9 w-full rounded-lg border border-[#d5e3ec] bg-white pl-8 pr-3 text-sm placeholder:text-[#8a96a6] focus:border-[var(--brand)] focus:outline-none focus:ring-3 focus:ring-[var(--brand)]/20"
          />
        </div>
        {selects.map((s) => (
          <div key={s.name}>
            <label htmlFor={`filter-${s.name}`} className="sr-only">
              {s.label}
            </label>
            <select
              id={`filter-${s.name}`}
              name={s.name}
              defaultValue={s.value ?? "all"}
              onChange={() => formRef.current?.requestSubmit()}
              className="h-9 rounded-lg border border-[#d5e3ec] bg-white px-2.5 text-sm text-[#26364d] focus:border-[var(--brand)] focus:outline-none focus:ring-3 focus:ring-[var(--brand)]/20"
            >
              {s.options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        ))}
        <button type="submit" className={adminButton({ variant: "secondary" })}>
          Filtrar
        </button>
        {active ? (
          <Link href={pathname} className={adminButton({ variant: "ghost" })}>
            <X aria-hidden />
            Limpiar
          </Link>
        ) : null}
      </form>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
