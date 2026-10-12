"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Clock, Menu, ShoppingBag, Truck, UserRound, X } from "lucide-react";
import { AudienceToggle } from "@/components/storefront/audience-toggle";
import { BrandMark } from "@/components/storefront/brand-mark";
import { RegionSelector } from "@/components/storefront/region-selector";
import type { Audience, ModuleFlags, RegionOption } from "@/lib/modules";
import type { TopbarMessages } from "@/lib/storefront-defaults";

type NavItem = { href: string; label: string };

type Props = {
  brandName: string;
  logoUrl?: string | null;
  brandSubtitle?: string | null;
  topbar: TopbarMessages;
  cartCount: number;
  flags: ModuleFlags;
  /** Home sections that actually have content (nav links to empty anchors are hidden). */
  sections: { descuentos: boolean; planes: boolean; kits: boolean };
  showAudienceToggle: boolean;
  regions: RegionOption[];
  customerName?: string | null;
};

export function SiteHeader({
  brandName,
  logoUrl,
  brandSubtitle,
  topbar,
  cartCount,
  flags,
  sections,
  showAudienceToggle,
  regions,
  customerName,
}: Props) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
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
  if (flags.descuentos && sections.descuentos) nav.push({ href: "/#descuentos", label: "Descuentos" });
  if (flags.planes && sections.planes) nav.push({ href: "/#planes", label: "Planes" });
  if (flags.kits && sections.kits) nav.push({ href: "/#kits", label: "Kits" });
  nav.push({ href: "/#nosotros", label: "Nosotros" });
  nav.push({ href: "/#contacto", label: "Contacto" });

  const showRegions = flags.selectorRegion && regions.length > 0;
  const audienceToggle = flags.hogarEmpresa && showAudienceToggle;
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : !href.includes("#") && pathname.startsWith(href);

  return (
    <header
      className={`sticky top-0 z-30 bg-[var(--header-bg)]/90 backdrop-blur-xl backdrop-saturate-150 transition-shadow duration-300 ${
        scrolled
          ? "shadow-[0_1px_0_var(--sf-line),0_12px_32px_-18px_color-mix(in_srgb,var(--brand-deep)_45%,transparent)]"
          : "shadow-[0_1px_0_var(--sf-line)]"
      }`}
    >
      {topbar.delivery || topbar.hours ? (
        <div className="bg-[var(--topbar)] text-[var(--topbar-text)]">
          <div
            className={`mx-auto flex max-w-6xl flex-col gap-1 px-4 py-1.5 text-[11px] leading-snug sm:flex-row sm:items-center sm:text-xs md:px-6 ${
              topbar.delivery && topbar.hours ? "sm:justify-between" : "sm:justify-center"
            }`}
          >
            {topbar.delivery ? (
              <p className="flex items-start gap-2 sm:items-center">
                <Truck className="mt-px size-3.5 shrink-0 opacity-90 sm:mt-0" aria-hidden />
                <span>{topbar.delivery}</span>
              </p>
            ) : null}
            {topbar.hours ? (
              <p className="flex items-start gap-2 sm:max-w-md sm:items-center sm:text-right">
                <Clock className="mt-px size-3.5 shrink-0 opacity-90 sm:mt-0" aria-hidden />
                <span>{topbar.hours}</span>
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      <div>
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 md:px-6">
          <Link
            href="/"
            className="flex min-w-0 shrink items-center gap-3 rounded-xl transition-opacity hover:opacity-85 lg:shrink-0"
            aria-label={`${brandName} — inicio`}
          >
            <BrandMark name={brandName} logoUrl={logoUrl} subtitle={brandSubtitle} />
          </Link>

          <nav className="hidden min-w-0 items-center lg:flex">
            {nav.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                aria-current={isActive(item.href) ? "page" : undefined}
                className="sf-link-underline whitespace-nowrap rounded-lg px-2 py-1.5 text-[13px] xl:px-2.5 font-bold uppercase tracking-wide text-[var(--nav-text)] transition-colors duration-200 hover:text-[var(--header-hover)] aria-[current=page]:text-[var(--header-hover)]"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-2.5">
            {showRegions ? (
              <div className="hidden sm:block">
                <RegionSelector regions={regions} autoOpen />
              </div>
            ) : null}
            {audienceToggle ? (
              <div className="hidden md:block">
                <AudienceToggle audience={audience} />
              </div>
            ) : null}
            {flags.loginClientes ? (
              <Link
                href="/cuenta"
                className="hidden items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-1.5 text-xs font-bold uppercase text-[var(--nav-text)] transition-colors hover:bg-[var(--mist)] hover:text-[var(--header-hover)] sm:inline-flex"
              >
                <UserRound className="size-4" aria-hidden />
                {customerName ? customerName.split(" ")[0] : "Mi cuenta"}
              </Link>
            ) : null}
            <Link
              href="/carrito"
              aria-label={cartCount > 0 ? `Carrito, ${cartCount} productos` : "Carrito"}
              className="group relative inline-flex h-10 items-center gap-1.5 rounded-full px-2.5 text-sm font-bold uppercase text-[var(--nav-text)] transition-colors hover:bg-[var(--mist)] hover:text-[var(--header-hover)] sm:px-3.5"
            >
              <ShoppingBag
                className="size-5 transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110"
                aria-hidden
              />
              <span className="hidden sm:inline">Carrito</span>
              {cartCount > 0 ? (
                <span
                  key={cartCount}
                  className="sf-pop absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--brand)] px-1 text-[10px] text-white shadow-sm ring-2 ring-[var(--header-bg)] sm:-right-2.5 sm:-top-1.5"
                >
                  {cartCount}
                </span>
              ) : null}
            </Link>
            <button
              type="button"
              className="inline-flex size-10 items-center justify-center rounded-full border border-[var(--sf-line-strong)] text-[var(--nav-text)] transition hover:bg-[var(--mist)] active:scale-95 lg:hidden"
              aria-label={open ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
            >
              <span className="relative size-5">
                <Menu
                  className={`absolute inset-0 size-5 transition-all duration-300 ${
                    open ? "rotate-90 scale-50 opacity-0" : "rotate-0 scale-100 opacity-100"
                  }`}
                  aria-hidden
                />
                <X
                  className={`absolute inset-0 size-5 transition-all duration-300 ${
                    open ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-50 opacity-0"
                  }`}
                  aria-hidden
                />
              </span>
            </button>
          </div>
        </div>

        {/* Mobile panel */}
        <div
          className={`grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] lg:hidden ${
            open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          }`}
          inert={!open}
        >
          <div className="overflow-hidden">
            <div className="space-y-4 border-t border-[var(--sf-line)] px-4 py-4">
              {audienceToggle ? <AudienceToggle audience={audience} /> : null}
              {showRegions ? <RegionSelector regions={regions} /> : null}
              <nav className="flex flex-col gap-0.5">
                {nav.map((item, i) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    aria-current={isActive(item.href) ? "page" : undefined}
                    style={{ transitionDelay: open ? `${60 + i * 35}ms` : "0ms" }}
                    className={`rounded-xl px-3 py-2.5 text-sm font-bold uppercase text-[var(--nav-text)] transition-[transform,opacity,background-color,color] duration-300 hover:bg-[var(--mist)] hover:text-[var(--header-hover)] aria-[current=page]:bg-[var(--mist)] aria-[current=page]:text-[var(--header-hover)] ${
                      open ? "translate-x-0 opacity-100" : "-translate-x-2 opacity-0"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
                {flags.loginClientes ? (
                  <Link
                    href="/cuenta"
                    onClick={() => setOpen(false)}
                    className="mt-1 inline-flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold uppercase text-[var(--brand-deep)] hover:bg-[var(--mist)]"
                  >
                    <UserRound className="size-4" aria-hidden />
                    {customerName ? "Mi cuenta" : "Ingresar"}
                  </Link>
                ) : null}
              </nav>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

