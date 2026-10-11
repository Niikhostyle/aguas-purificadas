import Link from "next/link";
import { ChevronRight, House } from "lucide-react";
import type { ReactNode } from "react";

export type Crumb = { label: string; href?: string };

export function Breadcrumbs({ items, homeHref = "/admin" }: { items: Crumb[]; homeHref?: string }) {
  return (
    <nav aria-label="Ruta de navegación">
      <ol className="flex flex-wrap items-center gap-1.5 text-sm text-[#5a6578]">
        <li>
          <Link
            href={homeHref}
            className="grid size-6 place-items-center rounded text-[var(--brand)] hover:bg-[#e8f7fc]"
          >
            <House aria-hidden className="size-4" />
            <span className="sr-only">Inicio</span>
          </Link>
        </li>
        {items.map((c, i) => {
          const last = i === items.length - 1;
          return (
            <li key={`${c.label}-${i}`} className="flex items-center gap-1.5">
              <ChevronRight aria-hidden className="size-3.5 text-[#a9b6c4]" />
              {c.href && !last ? (
                <Link href={c.href} className="text-[var(--brand)] hover:underline">
                  {c.label}
                </Link>
              ) : (
                <span aria-current={last ? "page" : undefined} className="font-semibold text-[#12233d]">
                  {c.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function PageHeader({
  title,
  description,
  breadcrumbs,
  homeHref,
  actions,
}: {
  title: string;
  description?: ReactNode;
  breadcrumbs?: Crumb[];
  homeHref?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 space-y-3">
      {breadcrumbs ? <Breadcrumbs items={breadcrumbs} homeHref={homeHref} /> : null}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-[var(--brand-deep)] md:text-[26px]">
            {title}
          </h1>
          {description ? (
            <p className="mt-1 max-w-3xl text-sm text-[#5a6578]">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}
