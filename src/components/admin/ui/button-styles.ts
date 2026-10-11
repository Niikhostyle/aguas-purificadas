import { cn } from "@/lib/utils";

export type AdminButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type AdminButtonSize = "sm" | "md";

const BASE =
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand)] disabled:pointer-events-none disabled:opacity-50 [&>svg]:size-4";

const VARIANT: Record<AdminButtonVariant, string> = {
  primary: "bg-[var(--brand)] text-white shadow-sm hover:bg-[var(--brand-deep)]",
  secondary: "border border-[#d5e3ec] bg-white text-[var(--brand-deep)] hover:bg-[#f4f8fb]",
  ghost: "text-[var(--brand-deep)] hover:bg-[#eef3f7]",
  danger: "border border-red-200 bg-white text-red-700 hover:bg-red-50",
};

const SIZE: Record<AdminButtonSize, string> = {
  sm: "h-8 px-2.5 text-[13px]",
  md: "h-9 px-3.5 text-sm",
};

export function adminButton({
  variant = "primary",
  size = "md",
  className = "",
}: { variant?: AdminButtonVariant; size?: AdminButtonSize; className?: string } = {}) {
  return cn(BASE, VARIANT[variant], SIZE[size], className);
}
