"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const DEMO_HREF = "https://demo.mibidon.cl";
const ADMIN_HREF = "/admin/login?tenant=plataforma";

const displayFont = {
  fontFamily: "var(--font-mb-display), 'Archivo Black', sans-serif",
} as const;

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 border-b backdrop-blur-md transition-all duration-300 ${
        scrolled
          ? "border-[#c5d8e6] bg-[#f7fbfd]/95 shadow-md shadow-[#12326e]/10"
          : "border-[#d5e3ec]/80 bg-[#f7fbfd]/90"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 md:px-8">
        <a
          href="/"
          className="text-2xl tracking-tight text-[#12326e] transition hover:text-[#00b1e2] md:text-[1.75rem]"
          style={displayFont}
        >
          MiBidón
        </a>
        <nav className="flex items-center gap-3 text-sm font-semibold text-[#12326e] sm:gap-5">
          <a
            href="#servicios"
            className="hidden transition hover:text-[#00b1e2] sm:inline"
          >
            Qué incluye
          </a>
          <a
            href="#como"
            className="hidden transition hover:text-[#00b1e2] md:inline"
          >
            Cómo funciona
          </a>
          <Link href={ADMIN_HREF} className="transition hover:text-[#00b1e2]">
            Acceso
          </Link>
          <a
            href={DEMO_HREF}
            className="mb-cta-pulse rounded-md bg-[#00b1e2] px-3.5 py-2 text-white transition hover:-translate-y-0.5 hover:bg-[#0099c7] hover:shadow-lg hover:shadow-[#00b1e2]/35"
          >
            Ver demo
          </a>
        </nav>
      </div>
    </header>
  );
}
