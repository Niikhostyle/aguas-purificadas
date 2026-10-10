import Link from "next/link";
import type { Tenant } from "@prisma/client";
import { getResolvedCart } from "@/lib/cart";

export async function SiteHeader({ tenant }: { tenant: Tenant }) {
  const cart = await getResolvedCart(tenant.id);

  return (
    <header className="sticky top-0 z-20 border-b border-[#c5d8d2]/80 bg-[color-mix(in_srgb,var(--mist)_92%,white)] backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 md:px-8">
        <Link
          href="/"
          className="flex items-center gap-3 font-[family-name:var(--font-display)] text-xl tracking-tight text-[var(--brand-deep)] md:text-2xl"
        >
          {tenant.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={tenant.logoUrl}
              alt=""
              className="h-9 w-9 rounded-full object-cover ring-1 ring-[var(--brand)]/25"
            />
          ) : null}
          <span>{tenant.name}</span>
        </Link>
        <nav className="flex items-center gap-5 text-sm text-[#2f4a44]">
          <Link href="/productos" className="transition hover:text-[var(--brand)]">
            Productos
          </Link>
          <Link href="/carrito" className="transition hover:text-[var(--brand)]">
            Carrito
            {cart.itemCount > 0 ? (
              <span className="ml-1.5 inline-flex min-w-5 items-center justify-center rounded-full bg-[var(--brand)] px-1.5 text-xs text-white">
                {cart.itemCount}
              </span>
            ) : null}
          </Link>
          <Link
            href="/admin"
            className="rounded-md border border-[#c5d8d2] px-3 py-1.5 transition hover:bg-white"
          >
            Admin
          </Link>
        </nav>
      </div>
    </header>
  );
}
