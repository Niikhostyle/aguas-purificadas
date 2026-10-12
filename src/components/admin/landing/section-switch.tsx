"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { setLandingSectionEnabledAction } from "@/app/admin/(panel)/plataforma/landing/actions";
import { toast } from "@/lib/alerts";
import type { LandingSectionKey } from "@/lib/landing/schema";

export function Switch({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[var(--brand)]/40 disabled:opacity-50 ${
        checked ? "border-[var(--brand)] bg-[var(--brand)]" : "border-[#c9d6e0] bg-[#e3ebf1]"
      }`}
    >
      <span
        className={`inline-block size-5 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

export function StatusPill({ enabled }: { enabled: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${
        enabled ? "bg-emerald-50 text-emerald-700" : "bg-[#eef2f6] text-[#5a6578]"
      }`}
    >
      <span className={`size-1.5 rounded-full ${enabled ? "bg-emerald-500" : "bg-[#9aa7b5]"}`} />
      {enabled ? "Activo" : "Desactivado"}
    </span>
  );
}

/** Instant on/off from the global overview; persists and revalidates the landing. */
export function SectionToggle({
  sectionKey,
  title,
  initial,
}: {
  sectionKey: LandingSectionKey;
  title: string;
  initial: boolean;
}) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <div className="flex items-center gap-3">
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
      <StatusPill enabled={enabled} />
      <Switch
        checked={enabled}
        disabled={pending}
        label={`${title}: ${enabled ? "desactivar" : "activar"}`}
        onChange={(next) => {
          setEnabled(next);
          setError(null);
          start(async () => {
            const res = await setLandingSectionEnabledAction(sectionKey, next);
            if (!res.ok) {
              setEnabled(!next);
              setError(res.error);
              void toast.error(res.error);
            } else {
              void toast.success(`${title}: ${next ? "visible" : "oculta"} en la landing`);
            }
            router.refresh();
          });
        }}
      />
    </div>
  );
}
