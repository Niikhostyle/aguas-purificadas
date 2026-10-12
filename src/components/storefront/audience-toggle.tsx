"use client";

import { useOptimistic, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import type { Audience } from "@/lib/modules";

export function AudienceToggle({
  audience,
  hogarLabel = "Hogar",
  empresaLabel = "Empresa",
}: {
  audience: Audience;
  hogarLabel?: string;
  empresaLabel?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [shown, setShown] = useOptimistic(audience);

  const setAudience = (next: Audience) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("audience", next);
    startTransition(() => {
      setShown(next);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    });
  };

  return (
    <div
      className="relative inline-grid grid-cols-[1fr_1fr] rounded-full border border-[var(--sf-line-strong)] bg-white/90 p-1 shadow-[var(--sf-shadow-sm)] backdrop-blur"
      role="group"
      aria-label="Tipo de cliente"
    >
      <span
        aria-hidden
        className={`absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-full bg-[var(--brand-deep)] shadow-sm transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          shown === "empresa" ? "translate-x-full" : "translate-x-0"
        }`}
      />
      {(
        [
          ["hogar", hogarLabel],
          ["empresa", empresaLabel],
        ] as const
      ).map(([key, label]) => {
        const active = shown === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => setAudience(key)}
            className={`relative z-[1] rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors duration-300 ${
              active ? "text-white" : "text-[var(--brand-deep)] hover:text-[var(--brand)]"
            }`}
            aria-pressed={active}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
