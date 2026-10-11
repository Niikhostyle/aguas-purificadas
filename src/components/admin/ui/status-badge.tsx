import type { ReactNode } from "react";

export type StatusTone = "success" | "warning" | "danger" | "info" | "neutral" | "navy";

const TONE: Record<StatusTone, string> = {
  success: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  warning: "bg-amber-50 text-amber-800 ring-amber-600/25",
  danger: "bg-red-50 text-red-700 ring-red-600/20",
  info: "bg-[#e6f7fd] text-[#00739a] ring-[#00b1e2]/30",
  neutral: "bg-[#eef2f6] text-[#4a5a70] ring-[#7b8aa0]/25",
  navy: "bg-[#e7ecf6] text-[var(--brand-deep)] ring-[var(--brand-deep)]/20",
};

const DOT: Record<StatusTone, string> = {
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-red-500",
  info: "bg-[#00b1e2]",
  neutral: "bg-[#7b8aa0]",
  navy: "bg-[var(--brand-deep)]",
};

export function StatusBadge({
  tone = "neutral",
  children,
  dot = true,
}: {
  tone?: StatusTone;
  children: ReactNode;
  dot?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${TONE[tone]}`}
    >
      {dot ? <span aria-hidden className={`size-1.5 rounded-full ${DOT[tone]}`} /> : null}
      {children}
    </span>
  );
}

export const ORDER_STATUS_TONE: Record<string, StatusTone> = {
  pending: "warning",
  paid: "success",
  failed: "danger",
  cancelled: "neutral",
};
