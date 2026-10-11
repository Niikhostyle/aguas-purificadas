"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Printer } from "lucide-react";

/** Toggles every checkbox bound to `formId` (optionally within a group). */
export function SelectAllCheckbox({
  formId,
  group,
  label = "Seleccionar todos",
}: {
  formId: string;
  group?: string;
  label?: string;
}) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-[#5a6578]">
      <input
        type="checkbox"
        className="size-4 accent-[var(--brand)]"
        aria-label={label}
        onChange={(e) => {
          const sel = group
            ? `input[type=checkbox][form="${formId}"][data-group="${group}"]`
            : `input[type=checkbox][form="${formId}"]`;
          document.querySelectorAll<HTMLInputElement>(sel).forEach((el) => {
            el.checked = e.currentTarget.checked;
          });
        }}
      />
      {label}
    </label>
  );
}

export function PrintButton({ label = "Imprimir" }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--brand)] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[var(--brand-deep)] print:hidden"
    >
      <Printer className="size-4" />
      {label}
    </button>
  );
}

/** Opens WhatsApp in a new tab and records the reminder server-side. */
export function ReminderLink({
  href,
  onRecord,
  className,
  children,
}: {
  href: string;
  onRecord: () => Promise<void>;
  className?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-busy={pending}
      className={className}
      onClick={() =>
        start(async () => {
          await onRecord();
          router.refresh();
        })
      }
    >
      {children}
    </a>
  );
}
