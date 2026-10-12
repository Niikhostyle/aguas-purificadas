import Link from "next/link";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import type { ReactNode } from "react";

export type DataColumn<T> = {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  className?: string;
  headerClassName?: string;
  align?: "left" | "right" | "center";
  /** Hide below the md breakpoint to keep mobile rows readable. */
  hideOnMobile?: boolean;
  /** URL sort key; makes the header a sort toggle when the table has `sort`. */
  sortKey?: string;
  /** Mobile card role: the title row, the footer actions, or a labelled field (default). */
  mobile?: "title" | "actions" | "hidden";
  /** Label in mobile cards when `header` isn't plain text. */
  mobileLabel?: string;
};

export type TableSort = {
  by: string;
  dir: "asc" | "desc";
  basePath: string;
  /** Current query params (filters) to keep when toggling the sort. */
  params: Record<string, string | undefined>;
};

const ALIGN = { left: "text-left", right: "text-right", center: "text-center" } as const;
const JUSTIFY = { left: "justify-start", right: "justify-end", center: "justify-center" } as const;

/** Parse `?orden=key` / `?orden=-key` against an allow-list. */
export function parseSort<K extends string>(raw: string | undefined, allowed: readonly K[], fallback: `${"" | "-"}${K}`) {
  const value = raw && allowed.includes(raw.replace(/^-/, "") as K) ? raw : fallback;
  return { by: value.replace(/^-/, "") as K, dir: value.startsWith("-") ? ("desc" as const) : ("asc" as const) };
}

function sortHref(sort: TableSort, key: string) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(sort.params)) if (v && k !== "orden" && k !== "page" && k !== "p") sp.set(k, v);
  const nextDir = sort.by === key && sort.dir === "asc" ? "desc" : "asc";
  sp.set("orden", nextDir === "desc" ? `-${key}` : key);
  return `${sort.basePath}?${sp}`;
}

function HeaderCell<T>({ c, sort }: { c: DataColumn<T>; sort?: TableSort }) {
  if (!sort || !c.sortKey) return <>{c.header}</>;
  const active = sort.by === c.sortKey;
  const Icon = !active ? ArrowUpDown : sort.dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <Link
      href={sortHref(sort, c.sortKey)}
      scroll={false}
      className={`inline-flex items-center gap-1 rounded hover:text-[var(--brand-deep)] focus-visible:outline-2 focus-visible:outline-[var(--brand)] ${
        active ? "text-[var(--brand-deep)]" : ""
      } ${JUSTIFY[c.align ?? "left"]}`}
    >
      {c.header}
      <Icon aria-hidden className={`size-3 ${active ? "" : "opacity-50"}`} />
      <span className="sr-only">
        {active ? (sort.dir === "asc" ? ", orden ascendente" : ", orden descendente") : ", ordenar"}
      </span>
    </Link>
  );
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  caption,
  empty,
  rowClassName,
  minWidth = 560,
  sort,
  mobileCards = false,
}: {
  columns: DataColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  caption?: string;
  empty?: ReactNode;
  rowClassName?: (row: T) => string;
  /** Pixel width below which the table scrolls horizontally. */
  minWidth?: number;
  sort?: TableSort;
  /** Render rows as stacked cards below md instead of a scrolling table. */
  mobileCards?: boolean;
}) {
  if (rows.length === 0 && empty) return <>{empty}</>;
  const title = columns.find((c) => c.mobile === "title");
  const actions = columns.filter((c) => c.mobile === "actions");
  const fields = columns.filter((c) => !c.mobile);
  return (
    <>
      {mobileCards ? (
        <ul className="divide-y divide-[#eef3f7] md:hidden" aria-label={caption}>
          {rows.map((row) => (
            <li key={rowKey(row)} className={`space-y-2 px-4 py-3 ${rowClassName?.(row) ?? ""}`}>
              {title ? <div className="min-w-0">{title.cell(row)}</div> : null}
              {fields.length ? (
                <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-sm">
                  {fields.map((c) => (
                    <div key={c.key} className="min-w-0">
                      <dt className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#6b7a8f]">
                        {c.mobileLabel ?? c.header}
                      </dt>
                      <dd className="min-w-0 text-[#26364d]">{c.cell(row)}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}
              {actions.length ? (
                <div className="flex flex-wrap justify-end gap-1.5 pt-1">
                  {actions.map((c) => (
                    <div key={c.key}>{c.cell(row)}</div>
                  ))}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
      <div className={`overflow-x-auto ${mobileCards ? "hidden md:block" : ""}`}>
        <table className="w-full border-collapse text-sm" style={{ minWidth }}>
          {caption ? <caption className="sr-only">{caption}</caption> : null}
          <thead>
            <tr className="border-b border-[#e8f0f5] bg-[#f7fafc]">
              {columns.map((c) => (
                <th
                  key={c.key}
                  scope="col"
                  aria-sort={
                    sort && c.sortKey && sort.by === c.sortKey
                      ? sort.dir === "asc"
                        ? "ascending"
                        : "descending"
                      : undefined
                  }
                  className={`whitespace-nowrap px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6b7a8f] ${
                    ALIGN[c.align ?? "left"]
                  } ${c.hideOnMobile ? "hidden md:table-cell" : ""} ${c.headerClassName ?? ""}`}
                >
                  <HeaderCell c={c} sort={sort} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={rowKey(row)}
                className={`border-b border-[#eef3f7] transition-colors last:border-0 odd:bg-white even:bg-[#fbfdfe] hover:bg-[color-mix(in_srgb,var(--brand)_7%,white)] ${
                  rowClassName?.(row) ?? ""
                }`}
              >
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={`px-4 py-2.5 align-middle text-[#26364d] ${ALIGN[c.align ?? "left"]} ${
                      c.hideOnMobile ? "hidden md:table-cell" : ""
                    } ${c.className ?? ""}`}
                  >
                    {c.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
