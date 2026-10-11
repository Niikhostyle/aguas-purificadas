"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AudienceToggle } from "@/components/storefront/audience-toggle";
import { RegionSelector } from "@/components/storefront/region-selector";
import type { Audience, ModuleFlags, RegionOption } from "@/lib/modules";

type NavItem = { href: string; label: string };

type Props = {
  brandName: string;
  logoUrl?: string | null;
  deliveryBanner?: string | null;
  hoursBanner?: string | null;
  cartCount: number;
  flags: ModuleFlags;
  regions: RegionOption[];
  customerName?: string | null;
};

export function SiteHeader({
  brandName,
  logoUrl,
  deliveryBanner,
  hoursBanner,
  cartCount,
  flags,
  regions,
  customerName,
}: Props) {
  const searchParams = useSearchParams();
  const audience: Audience =
    searchParams.get("audience") === "empresa" ? "empresa" : "hogar";
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const nav: NavItem[] = [
    { href: "/", label: "Inicio" },
    { href: "/productos", label: "Productos" },
  ];
  if (flags.descuentos) nav.push({ href: "/#descuentos", label: "Descuentos" });
  if (flags.planes) nav.push({ href: "/#planes", label: "Planes" });
  if (flags.kits) nav.push({ href: "/#kits", label: "Kits" });
  nav.push({ href: "/#nosotros", label: "Nosotros" });
  nav.push({ href: "/#contacto", label: "Contacto" });

  const delivery =
    deliveryBanner ||
    "Despacho a comunas seleccionadas. Elegí tu ciudad para confirmar cobertura.";
  const hours =
    hoursBanner ||
    "Horario de atención: Lunes a Viernes 8:30–17:30 · Sábado 09:00–13:00";

  return (
    <header
      className={`sticky top-0 z-30 bg-white/95 backdrop-blur transition-shadow ${
        scrolled ? "shadow-md shadow-[#12326e]/10" : "shadow-sm"
      }`}
    >
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
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 md:px-6">
          <Link href="/" className="flex shrink-0 items-center gap-3">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt={brandName}
                className="h-12 w-auto object-contain md:h-14"
              />
            ) : (
              <span className="rc-display text-2xl font-semibold uppercase text-[var(--brand-deep)]">
                {brandName}
              </span>
            )}
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {nav.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="px-2.5 py-1 text-[13px] font-bold uppercase tracking-wide text-[var(--nav-text)] transition hover:text-[var(--brand)]"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            {flags.selectorRegion ? (
              <div className="hidden sm:block">
                <RegionSelector regions={regions} />
              </div>
            ) : null}
            {flags.hogarEmpresa ? (
              <div className="hidden md:block">
                <AudienceToggle audience={audience} />
              </div>
            ) : null}
            {flags.loginClientes ? (
              <Link
                href="/cuenta"
                className="hidden text-xs font-bold uppercase text-[var(--brand-deep)] hover:text-[var(--brand)] sm:inline"
              >
                {customerName ? customerName.split(" ")[0] : "Mi cuenta"}
              </Link>
            ) : null}
            <Link
              href="/carrito"
              className="relative inline-flex items-center gap-1.5 text-sm font-bold uppercase text-[var(--brand-deep)] hover:text-[var(--brand)]"
            >
              <span aria-hidden>🛒</span>
              <span className="hidden sm:inline">Carrito</span>
              {cartCount > 0 ? (
                <span className="absolute -right-3 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--brand)] px-1 text-[10px] text-white">
                  {cartCount}
                </span>
              ) : null}
            </Link>
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#d5e3ec] text-[var(--brand-deep)] lg:hidden"
              aria-label={open ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
            >
              <span className="text-lg">{open ? "✕" : "☰"}</span>
            </button>
          </div>
        </div>

        {/* Mobile panel */}
        <div
          className={`overflow-hidden border-t border-[#e8f0f5] transition-[max-height,opacity] duration-300 lg:hidden ${
            open ? "max-h-[480px] opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="space-y-4 px-4 py-4">
            {flags.hogarEmpresa ? (
              <AudienceToggle audience={audience} />
            ) : null}
            {flags.selectorRegion ? (
              <RegionSelector regions={regions} />
            ) : null}
            <nav className="flex flex-col gap-1">
              {nav.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-bold uppercase text-[var(--nav-text)] hover:bg-[#e8f7fc] hover:text-[var(--brand)]"
                >
                  {item.label}
                </Link>
              ))}
              {flags.loginClientes ? (
                <Link
                  href="/cuenta"
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-bold uppercase text-[var(--brand-deep)] hover:bg-[#e8f7fc]"
                >
                  {customerName ? "Mi cuenta" : "Ingresar"}
                </Link>
              ) : null}
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
}
