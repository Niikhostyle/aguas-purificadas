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
};

const ALIGN = { left: "text-left", right: "text-right", center: "text-center" } as const;

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  caption,
  empty,
  rowClassName,
  minWidth = 560,
}: {
  columns: DataColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  caption?: string;
  empty?: ReactNode;
  rowClassName?: (row: T) => string;
  /** Pixel width below which the table scrolls horizontally. */
  minWidth?: number;
}) {
  if (rows.length === 0 && empty) return <>{empty}</>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm" style={{ minWidth }}>
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        <thead>
          <tr className="border-b border-[#e8f0f5] bg-[#f7fafc]">
            {columns.map((c) => (
              <th
                key={c.key}
                scope="col"
                className={`whitespace-nowrap px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6b7a8f] ${
                  ALIGN[c.align ?? "left"]
                } ${c.hideOnMobile ? "hidden md:table-cell" : ""} ${c.headerClassName ?? ""}`}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              className={`border-b border-[#eef3f7] last:border-0 odd:bg-white even:bg-[#fbfdfe] hover:bg-[#eef9fd] ${
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
  );
}
