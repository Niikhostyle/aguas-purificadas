import Link from "next/link";
import type { Tenant } from "@prisma/client";
import { getResolvedCart } from "@/lib/cart";

const NAV = [
  { href: "/", label: "Inicio" },
  { href: "/productos", label: "Productos" },
  { href: "/#beneficios", label: "Ofertas" },
  { href: "/#nosotros", label: "Nosotros" },
  { href: "/#beneficios", label: "Purificación" },
  { href: "/#envasado", label: "Envasado" },
  { href: "/#contacto", label: "Contacto" },
];

export async function SiteHeader({ tenant }: { tenant: Tenant }) {
  const cart = await getResolvedCart(tenant.id);
  const delivery =
    tenant.deliveryBanner ||
    "Despacho para Talca, Curicó, Linares y comunas de la región.";
  const hours =
    tenant.hoursBanner ||
    "Horario de atención telefónica, Lunes a Viernes de 8:30 a 13:00 hrs y 14:00 a 17:30 hrs. - Sábado de 09:00 a 13:00 hrs.";

  return (
    <header className="sticky top-0 z-30 bg-white shadow-sm">
      {/* Top bars — despacho / horarios */}
      <div className="bg-[var(--topbar)] text-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-1.5 text-[11px] leading-snug sm:flex-row sm:items-center sm:justify-between sm:text-xs md:px-6">
          <p className="flex items-start gap-2">
            <span aria-hidden>🚚</span>
            <span>{delivery}</span>
          </p>
          <p className="flex items-start gap-2 sm:max-w-md sm:text-right">
            <span aria-hidden>🕒</span>
            <span>{hours}</span>
          </p>
        </div>
      </div>

      <div className="border-b border-[#d5e3ec]">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 md:px-6">
          <Link href="/" className="flex shrink-0 items-center gap-3">
            {tenant.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={tenant.logoUrl}
                alt={tenant.name}
                className="h-12 w-auto object-contain md:h-14"
              />
            ) : (
              <span className="rc-display text-2xl font-semibold uppercase text-[var(--brand-deep)]">
                {tenant.name}
              </span>
            )}
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {NAV.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="px-2.5 py-1 text-[13px] font-bold uppercase tracking-wide text-[var(--nav-text)] transition hover:text-[var(--brand)]"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/carrito"
              className="relative inline-flex items-center gap-1.5 text-sm font-bold uppercase text-[var(--brand-deep)] hover:text-[var(--brand)]"
            >
              <span aria-hidden>🛒</span>
              Carrito
              {cart.itemCount > 0 ? (
                <span className="absolute -right-3 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--brand)] px-1 text-[10px] text-white">
                  {cart.itemCount}
                </span>
              ) : null}
            </Link>
            <Link
              href="/admin"
              className="hidden text-xs font-bold uppercase text-[#5a6578] hover:text-[var(--brand)] sm:inline"
            >
              Admin
            </Link>
          </div>
        </div>

        {/* Mobile nav */}
        <nav className="flex gap-1 overflow-x-auto border-t border-[#e8f0f5] px-4 py-2 lg:hidden">
          {NAV.slice(0, 5).map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="whitespace-nowrap px-2 py-1 text-[11px] font-bold uppercase text-[var(--nav-text)]"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
