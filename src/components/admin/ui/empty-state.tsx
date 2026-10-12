import { Inbox } from "lucide-react";
import type { ReactNode } from "react";

/** Decorative water-drop illustration tinted with the brand color. */
function Illustration({ icon }: { icon: ReactNode }) {
  return (
    <span aria-hidden className="relative grid size-24 place-items-center">
      <svg viewBox="0 0 96 96" className="absolute inset-0 size-full text-[var(--brand)]">
        <circle cx="48" cy="48" r="46" fill="currentColor" opacity="0.06" />
        <circle cx="48" cy="48" r="34" fill="currentColor" opacity="0.08" />
        <circle cx="16" cy="24" r="4" fill="currentColor" opacity="0.25" />
        <circle cx="82" cy="70" r="3" fill="currentColor" opacity="0.3" />
        <circle cx="76" cy="18" r="2" fill="currentColor" opacity="0.35" />
        <path
          d="M22 74c6-3 12-3 18 0s12 3 18 0 12-3 18 0"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.25"
        />
      </svg>
      <span className="relative grid size-12 place-items-center rounded-2xl bg-white text-[var(--brand)] shadow-[0_8px_20px_-10px_rgba(18,50,110,0.45)] ring-1 ring-[#dde7ee] [&>svg]:size-6">
        {icon}
      </span>
    </span>
  );
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  compact = false,
}: {
  title: string;
  description?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  compact?: boolean;
}) {
  return (
    <div className={`flex flex-col items-center text-center ${compact ? "px-4 py-6" : "px-6 py-12"}`}>
      {compact ? (
        <span
          aria-hidden
          className="grid size-10 place-items-center rounded-full bg-[color-mix(in_srgb,var(--brand)_10%,white)] text-[var(--brand)] [&>svg]:size-5"
        >
          {icon ?? <Inbox />}
        </span>
      ) : (
        <Illustration icon={icon ?? <Inbox />} />
      )}
      <p className={`font-semibold text-[#12233d] ${compact ? "mt-2 text-sm" : "mt-3"}`}>{title}</p>
      {description ? <p className="mt-1 max-w-md text-sm text-[#5a6578]">{description}</p> : null}
      {action ? <div className="mt-4 flex flex-wrap justify-center gap-2">{action}</div> : null}
    </div>
  );
}
