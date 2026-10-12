import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

export type KpiTone = "brand" | "navy" | "info" | "success" | "warning" | "danger" | "neutral";

/** Percent change vs a previous period; `null` when there's no baseline to compare. */
export type KpiTrend = { current: number; previous: number; label: string; invert?: boolean };

const TONE_VAR: Record<KpiTone, { bg: string; fill: string; text: string }> = {
  brand: { bg: "var(--kpi-brand-bg, var(--brand))", fill: "var(--kpi-brand-fill, var(--brand))", text: "var(--kpi-brand-text, #fff)" },
  navy: { bg: "var(--kpi-navy-bg, var(--brand-deep))", fill: "var(--kpi-navy-fill, var(--brand-deep))", text: "var(--kpi-navy-text, #fff)" },
  info: { bg: "var(--kpi-info-bg, #00a6f4)", fill: "var(--kpi-info-fill, #00a6f4)", text: "var(--kpi-info-text, #fff)" },
  success: { bg: "var(--kpi-success-bg, #00bc7d)", fill: "var(--kpi-success-fill, #00bc7d)", text: "var(--kpi-success-text, #fff)" },
  warning: { bg: "var(--kpi-warning-bg, #fe9a00)", fill: "var(--kpi-warning-fill, #fe9a00)", text: "var(--kpi-warning-text, #fff)" },
  danger: { bg: "var(--kpi-danger-bg, #fb2c36)", fill: "var(--kpi-danger-fill, #fb2c36)", text: "var(--kpi-danger-text, #fff)" },
  neutral: { bg: "#7b8aa0", fill: "#7b8aa0", text: "#fff" },
};

function TrendChip({ trend }: { trend: KpiTrend }) {
  const { current, previous, label, invert } = trend;
  const diff = current - previous;
  const pct = previous > 0 ? Math.round((diff / previous) * 100) : null;
  const direction = diff === 0 ? "flat" : diff > 0 ? "up" : "down";
  const good = direction === "flat" ? null : (direction === "up") !== Boolean(invert);
  const Icon = direction === "up" ? ArrowUpRight : direction === "down" ? ArrowDownRight : Minus;
  const text =
    direction === "flat"
      ? "Sin cambio"
      : pct === null
        ? "Nuevo"
        : pct >= 1000
          ? `×${Math.round(current / previous)}`
          : `${diff > 0 ? "+" : ""}${pct}%`;
  const spoken =
    direction === "flat"
      ? `sin cambio ${label}`
      : pct === null
        ? `${diff > 0 ? "sube" : "baja"} ${label}, sin base de comparación`
        : `${diff > 0 ? "sube" : "baja"} ${Math.abs(pct)}% ${label}`;
  return (
    <span className="kpi-hint mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-[#7b8aa0]">
      <span
        className={`kpi-trend inline-flex items-center gap-0.5 rounded-full px-1.5 py-px text-[11px] font-semibold tabular-nums ${
          good === null ? "bg-[#eef3f7] text-[#5a6578]" : good ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
        }`}
      >
        <Icon aria-hidden className="size-3" />
        <span aria-hidden>{text}</span>
        <span className="sr-only">{spoken}</span>
      </span>
      <span aria-hidden className="leading-snug">{label}</span>
    </span>
  );
}

export function KpiCard({
  label,
  value,
  hint,
  icon,
  tone = "brand",
  href,
  trend,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon: ReactNode;
  tone?: KpiTone;
  href?: string;
  trend?: KpiTrend;
}) {
  const t = TONE_VAR[tone];
  const style = { "--kpi-bg": t.bg, "--kpi-fill": t.fill, "--kpi-text": t.text } as CSSProperties;
  const body = (
    <>
      <span
        aria-hidden
        className="kpi-icon grid size-11 shrink-0 place-items-center rounded-full bg-[var(--kpi-bg)] text-[var(--kpi-text)] transition-transform duration-200 group-hover:scale-105 motion-reduce:transition-none [&>svg]:size-5"
      >
        {icon}
      </span>
      <span className="min-w-0">
        <span className="kpi-label block text-[13px] text-[#5a6578]">{label}</span>
        <span className="kpi-value block text-2xl font-bold tabular-nums leading-tight text-[#12233d]">
          {value}
        </span>
        {hint ? <span className="kpi-hint block line-clamp-2 text-xs text-[#7b8aa0]">{hint}</span> : null}
        {trend ? <TrendChip trend={trend} /> : null}
      </span>
    </>
  );
  const cls =
    "kpi-card group flex items-center gap-4 rounded-xl border border-[#dde7ee] bg-white p-4 shadow-[0_1px_2px_rgba(16,40,70,0.04)]";
  return href ? (
    <Link
      href={href}
      style={style}
      className={`${cls} transition hover:-translate-y-0.5 hover:border-[var(--brand)]/50 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand)] motion-reduce:transition-none motion-reduce:hover:translate-y-0`}
    >
      {body}
    </Link>
  ) : (
    <div className={cls} style={style}>
      {body}
    </div>
  );
}

export function KpiGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{children}</div>;
}
