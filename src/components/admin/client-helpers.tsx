"use client";

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
