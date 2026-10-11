import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  FULFILLMENT_BADGE,
  FULFILLMENT_LABEL,
  PAYMENT_BADGE,
} from "@/lib/dispatch";
import { ORDER_STATUS_LABEL } from "@/lib/order-status";
import { cn } from "@/lib/utils";

export function Pill({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function FulfillmentBadge({ status }: { status: string }) {
  return (
    <Pill className={FULFILLMENT_BADGE[status] ?? "bg-slate-100 text-slate-700 ring-slate-200"}>
      {FULFILLMENT_LABEL[status] ?? status}
    </Pill>
  );
}

export function PaymentBadge({ status, provider }: { status: string; provider?: string | null }) {
  const label =
    status === "paid"
      ? `Pagado${provider ? ` · ${provider === "mock" ? "WebPay demo" : "WebPay"}` : ""}`
      : status === "pending"
        ? "Pago pendiente"
        : (ORDER_STATUS_LABEL[status] ?? status);
  return (
    <Pill className={PAYMENT_BADGE[status] ?? "bg-slate-100 text-slate-700 ring-slate-200"}>
      {label}
    </Pill>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "brand",
  href,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: LucideIcon;
  tone?: "brand" | "amber" | "sky" | "emerald" | "rose" | "navy";
  href?: string;
}) {
  const tones: Record<string, string> = {
    brand: "bg-[#e6f7fc] text-[#008bb3]",
    amber: "bg-amber-50 text-amber-700",
    sky: "bg-sky-50 text-sky-700",
    emerald: "bg-emerald-50 text-emerald-700",
    rose: "bg-rose-50 text-rose-700",
    navy: "bg-[#e8edf7] text-[#12326E]",
  };
  const body = (
    <div className="flex h-full items-start justify-between gap-3 rounded-xl border border-[#d5e3ec] bg-white p-4 shadow-[0_1px_2px_rgba(18,50,110,0.04)] transition hover:border-[#9fdcef]">
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-[#5a6578]">{label}</p>
        <p className="mt-1 text-3xl font-bold tabular-nums text-[var(--brand-deep)]">{value}</p>
        {hint ? <p className="mt-0.5 truncate text-xs text-[#5a6578]">{hint}</p> : null}
      </div>
      {Icon ? (
        <span className={cn("grid size-10 shrink-0 place-items-center rounded-lg", tones[tone])}>
          <Icon className="size-5" />
        </span>
      ) : null}
    </div>
  );
  return href ? (
    <Link href={href} className="block">
      {body}
    </Link>
  ) : (
    body
  );
}

export function Flash({ ok, error }: { ok?: string; error?: string }) {
  if (!ok && !error) return null;
  return (
    <p
      role="status"
      className={cn(
        "mt-4 rounded-lg px-3 py-2 text-sm ring-1 ring-inset print:hidden",
        ok ? "bg-emerald-50 text-emerald-800 ring-emerald-200" : "bg-rose-50 text-rose-800 ring-rose-200",
      )}
    >
      {ok ?? error}
    </p>
  );
}

export function PageHeader({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--brand-deep)]">
          {title}
        </h1>
        {subtitle ? <p className="mt-1 text-sm text-[#5a6578]">{subtitle}</p> : null}
      </div>
      {children ? <div className="flex flex-wrap gap-2 print:hidden">{children}</div> : null}
    </div>
  );
}

export function ModuleDisabled({ name }: { name: string }) {
  return (
    <div className="rounded-xl border border-dashed border-[#d5e3ec] bg-white px-6 py-12 text-center">
      <p className="text-lg font-semibold text-[var(--brand-deep)]">Módulo «{name}» desactivado</p>
      <p className="mt-2 text-sm text-[#5a6578]">
        Activalo en{" "}
        <Link href="/admin/modulos" className="text-[var(--brand)] hover:underline">
          Módulos
        </Link>{" "}
        para usarlo.
      </p>
    </div>
  );
}

export const btn = {
  primary:
    "inline-flex items-center justify-center gap-1.5 rounded-lg bg-[var(--brand)] px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--brand-deep)] disabled:opacity-50",
  navy:
    "inline-flex items-center justify-center gap-1.5 rounded-lg bg-[var(--brand-deep)] px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0c2350]",
  outline:
    "inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#d5e3ec] bg-white px-3 py-2 text-sm font-medium text-[var(--brand-deep)] transition hover:border-[var(--brand)] hover:text-[var(--brand)]",
  success:
    "inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700",
  ghost:
    "inline-flex items-center justify-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-[var(--brand-deep)] transition hover:bg-[#e6f7fc]",
};

export const field =
  "h-9 rounded-lg border border-[#d5e3ec] bg-white px-2.5 text-sm text-[var(--brand-deep)] outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/20";
