"use client";

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, Menu, X } from "lucide-react";

type NavLink = { href: string; label: string };
type Cta = { href: string; label: string; external: boolean };

const FOCUS =
  "outline-none focus-visible:ring-2 focus-visible:ring-sv-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-sv-surface";

function ctaProps(cta: Cta) {
  return cta.external ? { target: "_blank", rel: "noopener noreferrer" } : {};
}

function DemoDot() {
  return (
    <span className="relative flex size-2 shrink-0">
      <span className="mb-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-70" />
      <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
    </span>
  );
}

/**
 * Sticky landing navbar: logo / centered links / actions on desktop; links
 * collapse into a dropdown sheet below the desktop breakpoint. More than four
 * links push the breakpoint to xl so they never wrap.
 */
export function LandingHeader({
  logo,
  links,
  loginHref,
  demo,
  cta,
}: {
  logo: ReactNode;
  links: NavLink[];
  loginHref: string;
  demo: { href: string; label: string } | null;
  cta: Cta;
}) {
  const wide = links.length > 4;
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const close = useCallback((restoreFocus = false) => {
    setOpen(false);
    if (restoreFocus) toggleRef.current?.focus();
  }, []);

  useEffect(() => {
    const ids = links.map((l) => l.href).filter((h) => h.length > 1 && h.startsWith("#"));
    let raf = 0;
    const update = () => {
      raf = 0;
      setScrolled(window.scrollY > 8);
      const line = window.innerHeight * 0.35;
      let current: string | null = null;
      for (const href of ids) {
        const el = document.getElementById(href.slice(1));
        if (el && el.getBoundingClientRect().top <= line) current = href;
      }
      const atBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      const last = ids[ids.length - 1];
      if (atBottom && last && document.getElementById(last.slice(1))) current = last;
      setActive(current);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [links]);

  useEffect(() => {
    if (!open) return;
    const mq = window.matchMedia(wide ? "(min-width: 1280px)" : "(min-width: 1024px)");
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close(true);
    };
    const onMq = () => mq.matches && close();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.querySelector<HTMLElement>("a")?.focus({ preventScroll: true });
    window.addEventListener("keydown", onKey);
    mq.addEventListener("change", onMq);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
      mq.removeEventListener("change", onMq);
    };
  }, [open, wide, close]);

  const bp = wide
    ? { grid: "xl:grid-cols-[1fr_auto_1fr]", nav: "xl:flex", mobile: "xl:hidden" }
    : { grid: "lg:grid-cols-[1fr_auto_1fr]", nav: "lg:flex", mobile: "lg:hidden" };

  const raised = scrolled || open;

  return (
    <header
      className={`sticky top-0 z-40 border-b backdrop-blur-md transition-[background-color,border-color,box-shadow] duration-300 motion-reduce:transition-none ${
        raised
          ? "border-sv-surface-high bg-sv-surface/90 shadow-[0_12px_30px_-18px_rgba(0,22,61,0.35)]"
          : "border-transparent bg-sv-surface/95"
      }`}
    >
      <div
        className={`mx-auto grid h-16 max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 sm:gap-6 sm:px-6 lg:h-[72px] lg:px-8 ${bp.grid}`}
      >
        <Link
          href="/"
          aria-label="MiBidón - Inicio"
          className={`flex min-w-0 items-center justify-self-start rounded-md ${FOCUS}`}
          onClick={() => close()}
        >
          {logo}
        </Link>

        <nav aria-label="Principal" className={`hidden items-center gap-1 ${bp.nav}`}>
          {links.map((l) => {
            const isActive = active === l.href;
            return (
              <a
                key={l.href}
                href={l.href}
                aria-current={isActive ? "location" : undefined}
                className={`sv-label rounded-full px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors xl:px-4 ${FOCUS} ${
                  isActive
                    ? "bg-sv-secondary-fixed/50 text-sv-primary"
                    : "text-sv-on-surface-variant hover:bg-sv-surface-container hover:text-sv-primary"
                }`}
              >
                {l.label}
              </a>
            );
          })}
        </nav>

        <div className="flex items-center justify-self-end gap-2 lg:gap-3">
          <Link
            href={loginHref}
            className={`hidden h-10 items-center rounded-lg px-3 text-sm font-semibold whitespace-nowrap text-sv-primary transition-colors hover:bg-sv-surface-container md:inline-flex ${FOCUS}`}
          >
            Ingresar
          </Link>
          {demo ? (
            <a
              href={demo.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex h-10 items-center gap-2 rounded-full border-2 border-sv-secondary bg-sv-secondary-fixed/50 px-3.5 text-sm font-bold whitespace-nowrap text-sv-on-secondary-fixed-variant transition-colors hover:bg-sv-secondary hover:text-white ${FOCUS}`}
            >
              <DemoDot />
              <span>{demo.label}</span>
            </a>
          ) : null}
          <a
            href={cta.href}
            {...ctaProps(cta)}
            className={`sv-shine hidden h-10 items-center gap-1.5 rounded-lg bg-sv-primary px-4 text-sm font-semibold whitespace-nowrap text-white shadow-sm hover:bg-sv-primary-container sm:inline-flex ${FOCUS}`}
          >
            <span>{cta.label}</span>
            <ArrowRight className="sv-arrow size-4" aria-hidden />
          </a>
          <button
            ref={toggleRef}
            type="button"
            data-nav-toggle
            aria-expanded={open}
            aria-controls={panelId}
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            onClick={() => setOpen((v) => !v)}
            className={`inline-flex size-10 shrink-0 items-center justify-center rounded-lg text-sv-primary transition-colors hover:bg-sv-surface-container ${bp.mobile} ${FOCUS}`}
          >
            {open ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
          </button>
        </div>
      </div>

      <div
        className={`absolute inset-x-0 top-full h-dvh bg-sv-primary/20 transition-opacity duration-200 ${bp.mobile} ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden
        onClick={() => close()}
      />
      <div
        ref={panelRef}
        id={panelId}
        hidden={!open}
        className={`absolute inset-x-0 top-full border-b border-sv-surface-high bg-sv-surface shadow-xl ${bp.mobile}`}
      >
        <nav aria-label="Menú móvil" className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
          <ul className="flex flex-col">
            {links.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  onClick={() => close()}
                  aria-current={active === l.href ? "location" : undefined}
                  className={`sv-label flex h-12 items-center rounded-lg px-3 text-base font-semibold transition-colors ${FOCUS} ${
                    active === l.href
                      ? "bg-sv-secondary-fixed/50 text-sv-primary"
                      : "text-sv-on-surface-variant hover:bg-sv-surface-container hover:text-sv-primary"
                  }`}
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-3 grid grid-cols-1 gap-2 border-t border-sv-surface-high pt-4 pb-1 min-[420px]:grid-cols-2 md:hidden">
            <Link
              href={loginHref}
              onClick={() => close()}
              className={`inline-flex h-11 items-center justify-center rounded-lg border border-sv-surface-high text-sm font-semibold text-sv-primary transition-colors hover:bg-sv-surface-container ${FOCUS}`}
            >
              Ingresar
            </Link>
            <a
              href={cta.href}
              {...ctaProps(cta)}
              onClick={() => close()}
              className={`sv-shine inline-flex h-11 items-center justify-center gap-1.5 rounded-lg bg-sv-primary text-sm font-semibold text-white shadow-sm hover:bg-sv-primary-container ${FOCUS}`}
            >
              <span>{cta.label}</span>
              <ArrowRight className="sv-arrow size-4" aria-hidden />
            </a>
          </div>
        </nav>
      </div>
    </header>
  );
}
