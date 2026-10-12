"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
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

  return (
    <header
      className={`sticky top-0 z-30 bg-[var(--header-bg)]/95 backdrop-blur transition-shadow ${
        scrolled ? "shadow-md shadow-[#12326e]/10" : "shadow-sm"
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
              <p className="flex items-start gap-2">
                <span aria-hidden>🚚</span>
                <span>{topbar.delivery}</span>
              </p>
            ) : null}
            {topbar.hours ? (
              <p className="flex items-start gap-2 sm:max-w-md sm:text-right">
                <span aria-hidden>🕒</span>
                <span>{topbar.hours}</span>
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="border-b border-[#d5e3ec]">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 md:px-6">
          <Link href="/" className="flex min-w-0 shrink items-center gap-3" aria-label={`${brandName} — inicio`}>
            <BrandMark name={brandName} logoUrl={logoUrl} subtitle={brandSubtitle} />
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {nav.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="px-2.5 py-1 text-[13px] font-bold uppercase tracking-wide text-[var(--nav-text)] transition hover:text-[var(--header-hover)]"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
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
                className="hidden whitespace-nowrap text-xs font-bold uppercase text-[var(--nav-text)] hover:text-[var(--header-hover)] sm:inline"
              >
                {customerName ? customerName.split(" ")[0] : "Mi cuenta"}
              </Link>
            ) : null}
            <Link
              href="/carrito"
              className="relative inline-flex items-center gap-1.5 text-sm font-bold uppercase text-[var(--nav-text)] hover:text-[var(--header-hover)]"
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
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#d5e3ec] text-[var(--nav-text)] lg:hidden"
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
            {audienceToggle ? (
              <AudienceToggle audience={audience} />
            ) : null}
            {showRegions ? (
              <RegionSelector regions={regions} />
            ) : null}
            <nav className="flex flex-col gap-1">
              {nav.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-bold uppercase text-[var(--nav-text)] hover:bg-[var(--mist)] hover:text-[var(--header-hover)]"
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
