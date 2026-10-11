import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function paginate(searchParam: string | undefined, total: number, pageSize: number) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const raw = Number.parseInt(searchParam ?? "1", 10);
  const page = Number.isFinite(raw) ? Math.min(Math.max(raw, 1), pages) : 1;
  return { page, pages, skip: (page - 1) * pageSize, take: pageSize };
}

export function Pagination({
  page,
  pages,
  total,
  pageSize,
  basePath,
  params,
  noun = "registros",
}: {
  page: number;
  pages: number;
  total: number;
  pageSize: number;
  basePath: string;
  params: Record<string, string | undefined>;
  noun?: string;
}) {
  const href = (p: number) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v && k !== "page") sp.set(k, v);
    if (p > 1) sp.set("page", String(p));
    const s = sp.toString();
    return s ? `${basePath}?${s}` : basePath;
  };
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const btn =
    "inline-flex h-8 items-center gap-1 rounded-lg border border-[#d5e3ec] bg-white px-2.5 text-[13px] font-medium text-[var(--brand-deep)] hover:bg-[#f4f8fb]";
  const off = "pointer-events-none opacity-40";

  return (
    <nav aria-label="Paginación" className="flex flex-wrap items-center justify-between gap-3 text-[13px] text-[#5a6578]">
      <p>
        Mostrando <span className="font-semibold tabular-nums text-[#12233d]">{from}–{to}</span> de{" "}
        <span className="font-semibold tabular-nums text-[#12233d]">{total}</span> {noun}
      </p>
      <div className="flex items-center gap-2">
        <Link href={href(page - 1)} aria-disabled={page <= 1} tabIndex={page <= 1 ? -1 : undefined} className={`${btn} ${page <= 1 ? off : ""}`}>
          <ChevronLeft aria-hidden className="size-4" />
          Anterior
        </Link>
        <span className="tabular-nums">
          {page} / {pages}
        </span>
        <Link href={href(page + 1)} aria-disabled={page >= pages} tabIndex={page >= pages ? -1 : undefined} className={`${btn} ${page >= pages ? off : ""}`}>
          Siguiente
          <ChevronRight aria-hidden className="size-4" />
        </Link>
      </div>
    </nav>
  );
}
