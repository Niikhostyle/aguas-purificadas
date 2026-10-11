"use client";

import { useRef } from "react";
import Link from "next/link";
import type { OfferItem } from "@/lib/modules";

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
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 scrollbar-thin"
      >
        {offers.map((o) => (
          <article
            key={o.id}
            className="w-[min(85vw,320px)] shrink-0 snap-start overflow-hidden rounded-2xl bg-[linear-gradient(160deg,#e8f7fc_0%,#ffffff_55%)] ring-1 ring-[#d5e3ec]"
          >
            {o.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={o.imageUrl}
                alt=""
                className="h-40 w-full object-cover"
              />
            ) : (
              <div className="h-40 bg-[linear-gradient(135deg,var(--brand)_0%,var(--brand-deep)_100%)]" />
            )}
            <div className="p-5">
              {o.badge ? (
                <span className="inline-block bg-[var(--brand)] px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">
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
                  className="mt-4 inline-block text-sm font-bold uppercase text-[var(--brand)] hover:underline"
                >
                  Ver oferta
                </Link>
              ) : null}
            </div>
          </article>
        ))}
      </div>
      {offers.length > 1 ? (
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => scroll(-1)}
            className="rounded-full border border-[#c5d8e6] px-3 py-1 text-sm font-bold text-[var(--brand-deep)] hover:bg-[#e8f7fc]"
            aria-label="Ofertas anteriores"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => scroll(1)}
            className="rounded-full border border-[#c5d8e6] px-3 py-1 text-sm font-bold text-[var(--brand-deep)] hover:bg-[#e8f7fc]"
            aria-label="Ofertas siguientes"
          >
            ›
          </button>
        </div>
      ) : null}
    </div>
  );
}
