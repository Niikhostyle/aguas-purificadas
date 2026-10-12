import Link from "next/link";
import { Droplets, PackageOpen, Recycle, Refrigerator } from "lucide-react";
import type { InventorySnapshot, StockLine } from "@/lib/inventory";
import { cn } from "@/lib/utils";

function Meter({ pct, tone = "brand", label }: { pct: number; tone?: "brand" | "success" | "warning" | "danger"; label: string }) {
  const color = {
    brand: "bg-[var(--brand)]",
    success: "bg-[var(--kpi-success-bg,#00bc7d)]",
    warning: "bg-[var(--kpi-warning-bg,#fe9a00)]",
    danger: "bg-[var(--kpi-danger-bg,#fb2c36)]",
  }[tone];
  const v = Math.max(0, Math.min(100, Math.round(pct)));
  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={v}
      className="mt-2 h-2 overflow-hidden rounded-full bg-[#e8f0f5]"
    >
      <div className={cn("h-full rounded-full transition-[width] duration-500", color)} style={{ width: `${v}%` }} />
    </div>
  );
}

function Breakdown({ lines }: { lines: StockLine[] }) {
  if (lines.length < 2) return null;
  return (
    <ul className="mt-2 space-y-0.5 text-xs text-[#5a6578]">
      {lines.slice(0, 4).map((l) => (
        <li key={l.id} className="flex justify-between gap-2">
          <span className="truncate">{l.name}</span>
          <span className="tabular-nums font-medium text-[#12233d]">{l.stock.toLocaleString("es-CL")}</span>
        </li>
      ))}
    </ul>
  );
}

function Row({
  icon,
  title,
  value,
  unit,
  chip,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  value: number;
  unit: string;
  chip?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <li className="px-4 py-3.5">
      <p className="flex items-center gap-1.5 text-[13px] font-semibold text-[#12233d] [&>svg]:size-4 [&>svg]:text-[var(--brand)]">
        {icon}
        {title}
      </p>
      <div className="mt-1 flex items-baseline justify-between gap-2">
        <p className="text-[22px] font-bold leading-none tabular-nums text-[var(--brand-deep)]">
          {value.toLocaleString("es-CL")} <span className="text-xs font-medium text-[#5a6578]">{unit}</span>
        </p>
        {chip}
      </div>
      {children}
    </li>
  );
}

export function hasInventoryData(inv: InventorySnapshot) {
  return Boolean(inv.full || inv.dispensers || inv.envases);
}

export function InventoryPanel({ inv, showEnvasesLink }: { inv: InventorySnapshot; showEnvasesLink: boolean }) {
  const { full, dispensers, envases, demandToday } = inv;
  const short = full ? Math.max(0, demandToday - full.total) : 0;
  return (
    <section
      aria-labelledby="inv-title"
      className="flex h-full flex-col overflow-hidden rounded-xl border-2 border-[var(--brand-deep)] bg-white shadow-[0_4px_18px_rgba(16,40,70,0.08)]"
    >
      <header className="flex items-center justify-between gap-2 border-b border-[#e8f0f5] px-4 py-3">
        <div>
          <h2 id="inv-title" className="text-[15px] font-semibold text-[#12233d]">
            Inventario en tiempo real
          </h2>
          <p className="text-xs text-[#5a6578]">Stock de bodega y envases</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
          <span aria-hidden className="mb-live-dot size-1.5 rounded-full bg-emerald-500" /> En vivo
        </span>
      </header>
      <ul className="flex-1 divide-y divide-[#eef3f7]">
        {full ? (
          <Row
            icon={<Droplets />}
            title="Bidones llenos"
            value={full.total}
            unit="disponibles"
            chip={
              demandToday ? (
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                    short ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700",
                  )}
                >
                  {demandToday} por despachar hoy
                </span>
              ) : null
            }
          >
            <Meter
              label="Cobertura de la demanda de hoy"
              pct={demandToday ? (full.total / demandToday) * 100 : 100}
              tone={short ? "danger" : full.total < demandToday * 1.5 ? "warning" : "success"}
            />
            <p className={cn("mt-1 text-[11px]", short ? "font-medium text-rose-700" : "text-[#7b8aa0]")}>
              {short ? `Faltan ${short} para cubrir las entregas de hoy` : demandToday ? "Cubre las entregas de hoy" : "Sin entregas pendientes hoy"}
            </p>
            <Breakdown lines={full.lines} />
          </Row>
        ) : null}
        {envases ? (
          <Row
            icon={<Recycle />}
            title="Envases vacíos en la calle"
            value={envases.inStreet}
            unit={`en ${envases.owing} clientes`}
            chip={
              envases.receivedToday ? (
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                  +{envases.receivedToday} recibidos hoy
                </span>
              ) : null
            }
          >
            <Meter label="Tasa de retorno de envases (30 días)" pct={envases.returnRate} tone={envases.returnRate >= 80 ? "success" : envases.returnRate >= 50 ? "warning" : "danger"} />
            <p className="mt-1 text-[11px] text-[#7b8aa0]">
              Retorno 30 días: {envases.returnRate}% ({envases.in30} de {envases.out30})
            </p>
          </Row>
        ) : null}
        {dispensers ? (
          <Row icon={<Refrigerator />} title="Dispensadores" value={dispensers.total} unit="disponibles">
            <Meter
              label="Stock de dispensadores"
              pct={Math.min(100, dispensers.total * 10)}
              tone={dispensers.total <= 2 ? "danger" : dispensers.total <= 5 ? "warning" : "brand"}
            />
            <Breakdown lines={dispensers.lines} />
          </Row>
        ) : null}
      </ul>
      <footer className="flex flex-wrap gap-x-4 gap-y-1 border-t border-[#e8f0f5] bg-[#fafcfd] px-4 py-2.5 text-xs">
        <Link href="/admin/productos" className="font-medium text-[var(--brand)] hover:underline">
          Ajustar stock
        </Link>
        {showEnvasesLink ? (
          <Link href="/admin/envases" className="inline-flex items-center gap-1 font-medium text-[var(--brand)] hover:underline">
            <PackageOpen className="size-3.5" /> Libro de envases
          </Link>
        ) : null}
      </footer>
    </section>
  );
}
