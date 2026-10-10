import Link from "next/link";
import type { Tenant } from "@prisma/client";

export function SiteHeader({ tenant }: { tenant: Tenant }) {
  return (
    <header className="absolute inset-x-0 top-0 z-20">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 md:px-8">
        <Link
          href="/"
          className="font-[family-name:var(--font-display)] text-xl tracking-tight text-white md:text-2xl"
        >
          {tenant.name}
        </Link>
        <nav className="flex items-center gap-5 text-sm text-white/90">
          <Link href="/productos" className="transition hover:text-white">
            Productos
          </Link>
          <Link
            href="/#nosotros"
            className="hidden transition hover:text-white sm:inline"
          >
            Nosotros
          </Link>
          <Link
            href="/admin"
            className="rounded-md border border-white/35 px-3 py-1.5 text-white/95 transition hover:bg-white/10"
          >
            Admin
          </Link>
        </nav>
      </div>
    </header>
  );
}
