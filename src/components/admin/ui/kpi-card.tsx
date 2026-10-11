import Link from "next/link";
import type { ReactNode } from "react";

export type KpiTone = "brand" | "navy" | "info" | "success" | "warning" | "danger" | "neutral";

const TONE: Record<KpiTone, string> = {
  brand: "bg-[var(--brand)] text-white",
  navy: "bg-[var(--brand-deep)] text-white",
  info: "bg-sky-500 text-white",
  success: "bg-emerald-500 text-white",
  warning: "bg-amber-500 text-white",
  danger: "bg-red-500 text-white",
  neutral: "bg-[#7b8aa0] text-white",
};

export function KpiCard({
  label,
  value,
  hint,
  icon,
  tone = "brand",
  href,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon: ReactNode;
  tone?: KpiTone;
  href?: string;
}) {
  const body = (
    <>
      <span
        aria-hidden
        className={`grid size-11 shrink-0 place-items-center rounded-full [&>svg]:size-5 ${TONE[tone]}`}
      >
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-[13px] text-[#5a6578]">{label}</span>
        <span className="block text-2xl font-bold tabular-nums leading-tight text-[#12233d]">
          {value}
        </span>
        {hint ? <span className="block truncate text-xs text-[#7b8aa0]">{hint}</span> : null}
      </span>
    </>
  );
  const cls =
    "flex items-center gap-4 rounded-xl border border-[#dde7ee] bg-white p-4 shadow-[0_1px_2px_rgba(16,40,70,0.04)]";
  return href ? (
    <Link
      href={href}
      className={`${cls} transition hover:border-[var(--brand)]/50 hover:shadow-md focus-visible:outline-2 focus-visible:outline-[var(--brand)]`}
    >
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

export function KpiGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{children}</div>;
}
