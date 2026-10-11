"use client";

import { useEffect, useRef } from "react";

/** Header checkbox that toggles every `input[name=…][form=…]` row checkbox. */
export function SelectAllCheckbox({ formId, name, label }: { formId: string; name: string; label: string }) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const boxes = () =>
      Array.from(document.querySelectorAll<HTMLInputElement>(`input[name="${name}"][form="${formId}"]`));
    const sync = () => {
      const all = boxes();
      const checked = all.filter((b) => b.checked).length;
      if (ref.current) {
        ref.current.checked = all.length > 0 && checked === all.length;
        ref.current.indeterminate = checked > 0 && checked < all.length;
      }
      const counter = document.getElementById(`${formId}-count`);
      if (counter) counter.textContent = String(checked);
      document
        .querySelectorAll<HTMLButtonElement>(`button[form="${formId}"]`)
        .forEach((b) => (b.disabled = checked === 0));
    };
    sync();
    document.addEventListener("change", sync);
    return () => document.removeEventListener("change", sync);
  }, [formId, name]);

  return (
    <input
      ref={ref}
      type="checkbox"
      aria-label={label}
      onChange={(e) => {
        document
          .querySelectorAll<HTMLInputElement>(`input[name="${name}"][form="${formId}"]`)
          .forEach((b) => (b.checked = e.target.checked));
        document.dispatchEvent(new Event("change"));
      }}
      className="size-4 rounded accent-[var(--brand)]"
    />
  );
}
