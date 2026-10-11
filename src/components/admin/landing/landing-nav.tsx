"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SECTION_META } from "@/lib/landing/admin-fields";

const BASE = "/admin/plataforma/landing";

function NavLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`block rounded-lg px-3 py-1.5 text-sm transition-colors ${
        active
          ? "bg-[var(--brand)] font-semibold text-white"
          : "text-[var(--brand-deep)] hover:bg-[#e8f7fc]"
      }`}
    >
      {label}
    </Link>
  );
}

export function LandingNav() {
  const pathname = usePathname();
  const groups = [
    { label: "Contenido", items: SECTION_META.filter((s) => s.primary) },
    { label: "Otros bloques", items: SECTION_META.filter((s) => !s.primary) },
  ];

  return (
    <aside className="lg:sticky lg:top-6 lg:self-start">
      <nav className="space-y-4 rounded-2xl border border-[#d5e3ec] bg-white p-3 shadow-sm" aria-label="Secciones de la landing">
        <NavLink href={BASE} label="Global · visibilidad" active={pathname === BASE} />
        {groups.map((g) => (
          <div key={g.label}>
            <p className="px-3 pb-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#8a96a6]">{g.label}</p>
            <div className="space-y-0.5">
              {g.items.map((s) => (
                <NavLink
                  key={s.key}
                  href={`${BASE}/${s.slug}`}
                  label={s.title}
                  active={pathname === `${BASE}/${s.slug}`}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
