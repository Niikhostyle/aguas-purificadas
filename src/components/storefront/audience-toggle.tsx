"use client";

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

  const setAudience = (next: Audience) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("audience", next);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div
      className="inline-flex rounded-full border border-[#c5d8e6] bg-white/90 p-1 shadow-sm backdrop-blur"
      role="group"
      aria-label="Tipo de cliente"
    >
      {(
        [
          ["hogar", hogarLabel],
          ["empresa", empresaLabel],
        ] as const
      ).map(([key, label]) => {
        const active = audience === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => setAudience(key)}
            className={`rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wide transition ${
              active
                ? "bg-[var(--brand-deep)] text-white"
                : "text-[var(--brand-deep)] hover:bg-[#e8f7fc]"
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
