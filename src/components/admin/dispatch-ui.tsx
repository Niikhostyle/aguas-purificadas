import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { AlertCircle, Blocks } from "lucide-react";
import {
  FULFILLMENT_BADGE,
  FULFILLMENT_LABEL,
  PAYMENT_BADGE,
} from "@/lib/dispatch";
import { ORDER_STATUS_LABEL } from "@/lib/order-status";
import { cn } from "@/lib/utils";
import { AutoBreadcrumbs } from "./ui/auto-breadcrumbs";
import { adminButton } from "./ui/button-styles";
import { EmptyState } from "./ui/empty-state";
import { KpiCard, type KpiTone, type KpiTrend } from "./ui/kpi-card";

export function Pill({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset",
        className,
      )}
    >
      <span aria-hidden className="size-1.5 rounded-full bg-current opacity-70" />
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

const STAT_TONE: Record<string, KpiTone> = {
  brand: "brand",
  amber: "warning",
  sky: "info",
  emerald: "success",
  rose: "danger",
  navy: "navy",
};

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "brand",
  href,
  trend,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: LucideIcon;
  tone?: "brand" | "amber" | "sky" | "emerald" | "rose" | "navy";
  href?: string;
  trend?: KpiTrend;
}) {
  return (
    <KpiCard
      label={label}
      value={value}
      hint={hint}
      icon={Icon ? <Icon /> : <Blocks />}
      tone={STAT_TONE[tone]}
      href={href}
      trend={trend}
    />
  );
}

/** Success messages arrive as toasts (FlashToaster); errors also stay inline so they remain visible. */
export function Flash({ error }: { ok?: string; error?: string }) {
  if (!error) return null;
  return (
    <p
      role="alert"
      className="mt-4 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-800 print:hidden"
    >
      <AlertCircle aria-hidden className="mt-0.5 size-4 shrink-0" />
      {error}
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
    <div className="space-y-3">
      <div className="print:hidden">
        <AutoBreadcrumbs />
      </div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-[var(--brand-deep)] md:text-[26px]">{title}</h1>
          {subtitle ? <p className="mt-1 max-w-3xl text-sm text-[#5a6578]">{subtitle}</p> : null}
        </div>
        {children ? <div className="flex flex-wrap items-center gap-2 print:hidden">{children}</div> : null}
      </div>
    </div>
  );
}

export function ModuleDisabled({ name }: { name: string }) {
  return (
    <div className="rounded-xl border border-dashed border-[#d5e3ec] bg-white">
      <EmptyState
        icon={<Blocks />}
        title={`Módulo «${name}» desactivado`}
        description="Actívalo en Módulos para usarlo."
        action={
          <Link href="/admin/modulos" className={adminButton({ variant: "secondary" })}>
            Ir a Módulos
          </Link>
        }
      />
    </div>
  );
}

export const btn = {
  primary: adminButton({ variant: "primary" }),
  navy: adminButton({ variant: "primary", className: "bg-[var(--brand-deep)] hover:bg-[#0c2350]" }),
  outline: adminButton({ variant: "secondary" }),
  success: adminButton({ variant: "primary", className: "bg-emerald-600 hover:bg-emerald-700" }),
  ghost: adminButton({ variant: "ghost", size: "sm", className: "h-7 px-2 text-xs" }),
};

export const field =
  "h-9 rounded-lg border border-[#d5e3ec] bg-white px-2.5 text-sm text-[#12233d] outline-none focus:border-[var(--brand)] focus:ring-3 focus:ring-[var(--brand)]/20";
