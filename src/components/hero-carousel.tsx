"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

export type HeroSlide = {
  image: string;
  /** If false, hide HTML copy (image already has marketing text). Default true. */
  showCopy?: boolean;
  eyebrow?: string;
  title?: string;
  body?: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
};

type Props = {
  slides: HeroSlide[];
  /** min height classes */
  className?: string;
  intervalMs?: number;
  /** marketing = Archivo-style display titles (MiBidón landing) */
  variant?: "storefront" | "marketing";
};

export function HeroCarousel({
  slides,
  className = "min-h-[420px] md:min-h-[520px]",
  intervalMs = 6000,
  variant = "storefront",
}: Props) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [touchX, setTouchX] = useState<number | null>(null);
  const count = slides.length;

  useEffect(() => {
    if (count <= 1 || paused) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % count);
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [count, intervalMs, paused]);

  if (count === 0) return null;

  const go = (dir: -1 | 1) => {
    setIndex((i) => (i + dir + count) % count);
  };

  return (
    <section
      className={`relative overflow-hidden ${className}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => setTouchX(e.touches[0]?.clientX ?? null)}
      onTouchEnd={(e) => {
        const end = e.changedTouches[0]?.clientX;
        if (touchX !== null && end !== undefined && Math.abs(end - touchX) > 40 && count > 1) {
          go(end < touchX ? 1 : -1);
        }
        setTouchX(null);
      }}
      aria-roledescription="carrusel"
      aria-label="Destacados"
    >
      {slides.map((slide, i) => {
        const active = i === index;
        const showCopy = slide.showCopy !== false;
        return (
          <div
            key={`${slide.image}-${i}`}
            className={`absolute inset-0 overflow-hidden transition-opacity duration-1000 ease-out ${
              active
                ? "z-[1] opacity-100"
                : "z-0 pointer-events-none opacity-0"
            }`}
            aria-hidden={!active}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={active ? `on-${index}` : "off"}
              src={slide.image}
              alt=""
              className={`absolute inset-0 h-full w-full object-cover ${
                active && variant === "storefront" ? "sf-kenburns" : ""
              }`}
            />
            {showCopy ? (
              <>
                <div
                  className={
                    variant === "marketing"
                      ? "absolute inset-0 bg-[linear-gradient(115deg,#12326ef5_0%,#00b1e2cc_48%,#12326ee6_100%)]"
                      : "absolute inset-0 bg-[image:var(--hero-overlay,linear-gradient(105deg,rgba(18,50,110,0.88)_0%,rgba(0,177,226,0.4)_55%,rgba(0,0,0,0.2)_100%))]"
                  }
                />
                <div
                  key={active ? `copy-${index}` : "copy-off"}
                  className={`relative mx-auto flex h-full min-h-[inherit] max-w-6xl flex-col px-4 py-16 md:px-6 ${
                    variant === "storefront" && active ? "sf-rise-stagger" : ""
                  } ${
                    variant === "marketing"
                      ? "justify-end pb-20 md:justify-center md:pb-28"
                      : "justify-center"
                  }`}
                >
                  {slide.eyebrow ? (
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/80 sm:text-sm">
                      {slide.eyebrow}
                    </p>
                  ) : null}
                  {slide.title ? (
                    <h1
                      className={
                        variant === "marketing"
                          ? "mt-4 max-w-3xl text-4xl leading-[1.05] tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl"
                          : "rc-display mt-3 max-w-2xl text-4xl uppercase leading-none text-white md:text-6xl"
                      }
                      style={
                        variant === "marketing"
                          ? {
                              fontFamily:
                                "var(--font-mb-display), 'Archivo Black', sans-serif",
                            }
                          : undefined
                      }
                    >
                      {slide.title}
                    </h1>
                  ) : null}
                  {slide.body ? (
                    <p className="mt-5 max-w-xl text-base leading-relaxed text-white/90 md:text-lg">
                      {slide.body}
                    </p>
                  ) : null}
                  {(slide.primaryHref || slide.secondaryHref) && (
                    <div className="mt-8 flex flex-wrap gap-3">
                      {slide.primaryHref && slide.primaryLabel ? (
                        <Link
                          href={slide.primaryHref}
                          className={
                            variant === "marketing"
                              ? "inline-flex rounded-md bg-white px-6 py-3.5 text-sm font-bold uppercase tracking-wide text-[#12326e] hover:bg-[#e8f7fc]"
                              : "rc-btn-primary group/cta inline-flex items-center gap-2 px-6 py-3 text-sm font-bold uppercase tracking-wide"
                          }
                        >
                          {slide.primaryLabel}
                          {variant === "storefront" ? (
                            <ArrowRight
                              className="size-4 transition-transform duration-300 group-hover/cta:translate-x-0.5"
                              aria-hidden
                            />
                          ) : null}
                        </Link>
                      ) : null}
                      {slide.secondaryHref && slide.secondaryLabel ? (
                        <Link
                          href={slide.secondaryHref}
                          className={
                            variant === "marketing"
                              ? "inline-flex rounded-md border border-white/70 bg-white/10 px-6 py-3.5 text-sm font-bold uppercase tracking-wide text-white backdrop-blur-sm hover:bg-white/20"
                              : "inline-flex items-center rounded-full border border-white/70 bg-white/10 px-6 py-3 text-sm font-bold uppercase tracking-wide text-white backdrop-blur-sm transition-colors duration-300 hover:bg-white hover:text-[var(--brand-deep)]"
                          }
                        >
                          {slide.secondaryLabel}
                        </Link>
                      ) : null}
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* Image-only slide (baked marketing art) — still need min height shell */
              <div className={`relative ${className}`} />
            )}
          </div>
        );
      })}

      {/* Ensure section height when all slides absolute */}
      <div className={`invisible ${className}`} aria-hidden />

      {count > 1 ? (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            className="absolute left-3 top-1/2 z-[2] hidden size-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white shadow-lg shadow-black/10 backdrop-blur-md transition duration-300 hover:scale-105 hover:bg-white/25 active:scale-95 sm:inline-flex md:left-5"
            aria-label="Slide anterior"
          >
            <ChevronLeft className="size-5" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            className="absolute right-3 top-1/2 z-[2] hidden size-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white shadow-lg shadow-black/10 backdrop-blur-md transition duration-300 hover:scale-105 hover:bg-white/25 active:scale-95 sm:inline-flex md:right-5"
            aria-label="Slide siguiente"
          >
            <ChevronRight className="size-5" aria-hidden />
          </button>
          <div className="absolute bottom-5 left-1/2 z-[2] flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-black/15 px-2.5 py-2 backdrop-blur-sm">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Ir al slide ${i + 1}`}
                aria-current={i === index}
                onClick={() => setIndex(i)}
                className={`h-2 rounded-full transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                  i === index
                    ? "w-6 bg-white"
                    : "w-2 bg-white/50 hover:bg-white/80"
                }`}
              />
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}
