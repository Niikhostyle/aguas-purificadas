import type { ReactNode } from "react";

export type StatsRow = {
  label: string;
  /** Hoy, Ayer, Este mes, Mes pasado, Total. */
  values: ReactNode[];
};

const HEADERS = ["Hoy", "Ayer", "Este mes", "Mes pasado", "Total"];

/** Period comparison grid (today / yesterday / month / last month / total). */
export function StatsTable({ rows, caption }: { rows: StatsRow[]; caption: string }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-[#e8f0f5] bg-[#f7fafc]">
            <th scope="col" className="px-4 py-2.5 text-left">
              <span className="sr-only">Métrica</span>
            </th>
            {HEADERS.map((h) => (
              <th
                key={h}
                scope="col"
                className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6b7a8f]"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label} className="border-b border-[#eef3f7] last:border-0 even:bg-[#fbfdfe]">
              <th scope="row" className="px-4 py-2.5 text-left font-medium text-[#26364d]">
                {r.label}
              </th>
              {r.values.map((v, i) => (
                <td key={i} className="px-4 py-2.5 text-right tabular-nums text-[#26364d]">
                  {v}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
