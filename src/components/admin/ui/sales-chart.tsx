"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from "recharts";

export type SalesDatum = { key: string; label: string; revenue: number; orders: number };

type Metric = "revenue" | "orders";

const clp = new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });
const compactClp = (v: number) =>
  v >= 1_000_000 ? `$${(v / 1_000_000).toLocaleString("es-CL", { maximumFractionDigits: 1 })}M` : v >= 1000 ? `$${Math.round(v / 1000)}k` : `$${v}`;
const fullDate = new Intl.DateTimeFormat("es-CL", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });

/** Reads theme colors from CSS variables so the chart follows Apariencia. */
function useThemeColors(ref: React.RefObject<HTMLElement | null>) {
  const [colors, setColors] = useState({ brand: "#00b1e2", deep: "#12326e" });
  useEffect(() => {
    if (!ref.current) return;
    const s = getComputedStyle(ref.current);
    const brand = s.getPropertyValue("--brand").trim();
    const deep = s.getPropertyValue("--brand-deep").trim();
    setColors((c) => ({ brand: brand || c.brand, deep: deep || c.deep }));
  }, [ref]);
  return colors;
}

function ChartTooltip({ active, payload }: TooltipContentProps<number, string>) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as SalesDatum;
  return (
    <div className="rounded-lg border border-[#dde7ee] bg-white px-3 py-2 text-xs shadow-lg">
      <p className="font-semibold capitalize text-[var(--brand-deep)]">{fullDate.format(new Date(`${d.key}T12:00:00Z`))}</p>
      <p className="mt-1 flex justify-between gap-4 text-[#3d4a5c]">
        <span>Ventas pagadas</span>
        <span className="font-semibold tabular-nums">{clp.format(d.revenue)}</span>
      </p>
      <p className="flex justify-between gap-4 text-[#3d4a5c]">
        <span>Pedidos</span>
        <span className="font-semibold tabular-nums">{d.orders}</span>
      </p>
    </div>
  );
}

export default function SalesChart({ data, height = 220 }: { data: SalesDatum[]; height?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const { brand, deep } = useThemeColors(ref);
  const [metric, setMetric] = useState<Metric>("revenue");
  const gradientId = useId().replace(/:/g, "");
  const total = data.reduce((s, d) => s + d[metric], 0);

  return (
    <div ref={ref}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-[#5a6578]">
          Total:{" "}
          <span className="font-semibold tabular-nums text-[#12233d]">
            {metric === "revenue" ? clp.format(total) : `${total} pedidos`}
          </span>
        </p>
        <div role="group" aria-label="Métrica del gráfico" className="inline-flex rounded-lg bg-[#eef3f7] p-0.5 text-xs font-semibold">
          {(
            [
              ["revenue", "Ventas"],
              ["orders", "Pedidos"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={metric === value}
              onClick={() => setMetric(value)}
              className={`rounded-md px-2.5 py-1 transition-colors focus-visible:outline-2 focus-visible:outline-[var(--brand)] ${
                metric === value ? "bg-white text-[var(--brand-deep)] shadow-sm" : "text-[#5a6578] hover:text-[var(--brand-deep)]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div style={{ height }} aria-hidden>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -12 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={brand} stopOpacity={0.95} />
                <stop offset="100%" stopColor={deep} stopOpacity={0.85} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="#e8f0f5" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={{ stroke: "#e8f0f5" }}
              tick={{ fontSize: 10, fill: "#8a96a6" }}
              interval="preserveStartEnd"
              minTickGap={8}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 10, fill: "#8a96a6" }}
              width={48}
              allowDecimals={false}
              tickFormatter={(v: number) => (metric === "revenue" ? compactClp(v) : String(v))}
            />
            <Tooltip
              cursor={{ fill: brand, fillOpacity: 0.08, radius: 6 }}
              content={(props) => <ChartTooltip {...(props as TooltipContentProps<number, string>)} />}
            />
            <Bar
              dataKey={metric}
              fill={`url(#${gradientId})`}
              radius={[5, 5, 0, 0]}
              maxBarSize={36}
              minPointSize={2}
              animationDuration={500}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <table className="sr-only">
        <caption>Ventas pagadas y pedidos por día, últimos {data.length} días</caption>
        <thead>
          <tr>
            <th scope="col">Día</th>
            <th scope="col">Ventas pagadas</th>
            <th scope="col">Pedidos</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.key}>
              <th scope="row">{d.label}</th>
              <td>{clp.format(d.revenue)}</td>
              <td>{d.orders}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
