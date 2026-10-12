"use client";

import { useRef } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import type { OfferItem } from "@/lib/modules";

const arrow =
  "inline-flex size-10 items-center justify-center rounded-full border border-[var(--sf-line-strong)] bg-white text-[var(--brand-deep)] shadow-[var(--sf-shadow-sm)] transition duration-300 hover:-translate-y-0.5 hover:border-[var(--brand)] hover:text-[var(--brand)] hover:shadow-[var(--sf-shadow-md)] active:translate-y-0 active:scale-95";

export function OffersCarousel({ offers }: { offers: OfferItem[] }) {
  const scroller = useRef<HTMLDivElement>(null);

  if (!offers.length) return null;

  const scroll = (dir: -1 | 1) => {
    const el = scroller.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.min(360, el.clientWidth * 0.8), behavior: "smooth" });
  };

  return (
    <div className="relative">
      <div
        ref={scroller}
        className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-5 overflow-x-auto px-4 pb-4 pt-1 [scrollbar-width:none] md:mx-0 md:scroll-px-0 md:px-0 [&::-webkit-scrollbar]:hidden"
      >
        {offers.map((o) => (
          <article
            key={o.id}
            className="sf-card sf-card-hover group w-[min(85vw,320px)] shrink-0 snap-start overflow-hidden"
          >
            <div className="overflow-hidden">
              {o.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={o.imageUrl}
                  alt=""
                  loading="lazy"
                  className="h-40 w-full object-cover transition duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
                />
              ) : (
                <div className="h-40 bg-[linear-gradient(135deg,var(--brand)_0%,var(--brand-deep)_100%)]" />
              )}
            </div>
            <div className="p-5">
              {o.badge ? (
                <span className="inline-flex rounded-full bg-[var(--brand)] px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white shadow-sm">
                  {o.badge}
                </span>
              ) : null}
              <h3 className="rc-display mt-2 text-xl uppercase text-[var(--brand-deep)]">
                {o.title}
              </h3>
              {o.subtitle ? (
                <p className="mt-1 text-sm text-[#5a6578]">{o.subtitle}</p>
              ) : null}
              {o.href ? (
                <Link
                  href={o.href}
                  className="mt-4 inline-flex items-center gap-1 text-sm font-bold uppercase text-[var(--brand)] transition-colors hover:text-[var(--brand-deep)]"
                >
                  Ver oferta
                  <ArrowRight
                    className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </Link>
              ) : null}
            </div>
          </article>
        ))}
      </div>
      {offers.length > 1 ? (
        <div className="mt-3 flex justify-end gap-2">
          <button type="button" onClick={() => scroll(-1)} className={arrow} aria-label="Ofertas anteriores">
            <ChevronLeft className="size-5" aria-hidden />
          </button>
          <button type="button" onClick={() => scroll(1)} className={arrow} aria-label="Ofertas siguientes">
            <ChevronRight className="size-5" aria-hidden />
          </button>
        </div>
      ) : null}
    </div>
  );
}
