import Link from "next/link";
import { CheckCircle2, Circle, Settings2 } from "lucide-react";

export type SetupStep = { label: string; href: string; done: boolean };

/** Only rendered for the tenant's own admin while browsing the storefront. */
export function SetupChecklist({ steps }: { steps: SetupStep[] }) {
  const done = steps.filter((s) => s.done).length;
  if (done === steps.length) return null;
  return (
    <aside
      aria-label="Configura tu tienda"
      className="border-b border-amber-200 bg-amber-50 text-[#5b4300]"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:gap-5 md:px-6">
        <div className="flex shrink-0 items-center gap-2">
          <Settings2 className="size-4" aria-hidden />
          <p className="text-sm font-bold">
            Configura tu tienda{" "}
            <span className="font-semibold opacity-75">
              · {done} de {steps.length} listos
            </span>
          </p>
        </div>
        <ul className="flex flex-wrap gap-2">
          {steps.map((s) => (
            <li key={s.label}>
              <Link
                href={s.href}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 transition ${
                  s.done
                    ? "bg-white/60 text-emerald-700 ring-emerald-200"
                    : "bg-white text-[#5b4300] ring-amber-300 hover:bg-amber-100"
                }`}
              >
                {s.done ? (
                  <CheckCircle2 className="size-3.5" aria-hidden />
                ) : (
                  <Circle className="size-3.5" aria-hidden />
                )}
                <span className={s.done ? "line-through decoration-emerald-300" : undefined}>{s.label}</span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="text-[11px] opacity-70 md:ml-auto">Solo tú ves este aviso.</p>
      </div>
    </aside>
  );
}
