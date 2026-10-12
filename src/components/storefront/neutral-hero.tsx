import Link from "next/link";
import { ArrowRight, Check, MessageCircle } from "lucide-react";

function WaterDrop({ id, className }: { id: string; className?: string }) {
  return (
    <svg viewBox="0 0 400 460" className={className} aria-hidden focusable="false">
      <defs>
        <linearGradient id={`${id}-body`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.35" />
        </linearGradient>
        <linearGradient id={`${id}-water`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--brand)" stopOpacity="0.55" />
          <stop offset="100%" stopColor="var(--brand-deep)" stopOpacity="0.85" />
        </linearGradient>
        <clipPath id={`${id}-clip`}>
          <path d="M200 24C200 24 72 186 72 284a128 128 0 0 0 256 0C328 186 200 24 200 24Z" />
        </clipPath>
      </defs>
      <ellipse cx="200" cy="436" rx="150" ry="16" fill="none" stroke="#fff" strokeOpacity="0.28" strokeWidth="2" />
      <ellipse cx="200" cy="436" rx="100" ry="10" fill="none" stroke="#fff" strokeOpacity="0.4" strokeWidth="2" />
      <ellipse cx="200" cy="436" rx="52" ry="5" fill="#fff" fillOpacity="0.35" />
      <path
        d="M200 24C200 24 72 186 72 284a128 128 0 0 0 256 0C328 186 200 24 200 24Z"
        fill={`url(#${id}-body)`}
      />
      <g clipPath={`url(#${id}-clip)`}>
        <path
          d="M40 300c40-22 80-22 120 0s80 22 120 0 80-22 120 0V460H40Z"
          fill={`url(#${id}-water)`}
        />
        <path
          d="M40 318c40-18 80-18 120 0s80 18 120 0 80-18 120 0"
          fill="none"
          stroke="#fff"
          strokeOpacity="0.45"
          strokeWidth="3"
        />
        <circle cx="160" cy="360" r="7" fill="#fff" fillOpacity="0.55" />
        <circle cx="236" cy="380" r="5" fill="#fff" fillOpacity="0.45" />
        <circle cx="196" cy="342" r="3.5" fill="#fff" fillOpacity="0.6" />
      </g>
      <path
        d="M200 24C200 24 72 186 72 284a128 128 0 0 0 256 0C328 186 200 24 200 24Z"
        fill="none"
        stroke="#fff"
        strokeOpacity="0.7"
        strokeWidth="3"
      />
      <path
        d="M128 262c4-44 30-92 54-126"
        fill="none"
        stroke="#fff"
        strokeOpacity="0.85"
        strokeWidth="10"
        strokeLinecap="round"
      />
      <circle cx="346" cy="120" r="10" fill="#fff" fillOpacity="0.35" />
      <circle cx="56" cy="170" r="6" fill="#fff" fillOpacity="0.3" />
      <circle cx="362" cy="214" r="4" fill="#fff" fillOpacity="0.45" />
    </svg>
  );
}

/** Brand-free hero for tenants that haven't uploaded their own banners yet. */
export function NeutralHero({
  brandName,
  title,
  body,
  highlights,
  whatsappHref,
}: {
  brandName: string;
  title: string;
  body: string;
  highlights: string[];
  whatsappHref?: string | null;
}) {
  return (
    <section className="relative overflow-hidden bg-[linear-gradient(120deg,var(--brand-deep)_0%,var(--brand-deep)_35%,var(--brand)_100%)] text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-32 -top-32 size-[26rem] rounded-full bg-white/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 right-[10%] size-[30rem] rounded-full bg-[var(--brand)] opacity-40 blur-3xl"
      />
      <WaterDrop
        id="nh-sm"
        className="pointer-events-none absolute -right-10 bottom-10 w-44 opacity-25 md:hidden"
      />

      <div className="relative mx-auto grid min-h-[440px] max-w-6xl items-center gap-10 px-4 pb-24 pt-14 md:min-h-[500px] md:grid-cols-[1.2fr_0.8fr] md:px-6 md:pb-28 md:pt-16">
        <div className="sf-rise-stagger">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/80 sm:text-sm">
            {brandName}
          </p>
          <h1 className="rc-display mt-3 max-w-2xl text-4xl uppercase leading-none md:text-6xl">
            {title}
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-white/90 md:text-lg">{body}</p>
          {highlights.length ? (
            <ul className="mt-6 flex flex-wrap gap-2">
              {highlights.map((h) => (
                <li
                  key={h}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-3 py-1 text-xs font-semibold ring-1 ring-white/25 backdrop-blur-sm"
                >
                  <Check className="size-3.5" aria-hidden />
                  {h}
                </li>
              ))}
            </ul>
          ) : null}
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/productos"
              className="group inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold uppercase tracking-wide text-[var(--brand-deep)] shadow-lg shadow-black/10 transition duration-300 hover:-translate-y-0.5 hover:bg-[var(--mist)] hover:shadow-xl active:translate-y-0 active:scale-[0.98]"
            >
              Ver productos
              <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden />
            </Link>
            {whatsappHref ? (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/10 px-6 py-3 text-sm font-bold uppercase tracking-wide text-white backdrop-blur-sm transition duration-300 hover:bg-white hover:text-[var(--brand-deep)] active:scale-[0.98]"
              >
                <MessageCircle className="size-4" aria-hidden />
                Pedir por WhatsApp
              </a>
            ) : null}
          </div>
        </div>
        <div className="relative hidden justify-center md:flex">
          <WaterDrop id="nh-lg" className="w-full max-w-[340px] drop-shadow-[0_30px_60px_rgba(0,0,0,0.18)]" />
        </div>
      </div>

      <svg
        aria-hidden
        viewBox="0 0 1440 80"
        preserveAspectRatio="none"
        className="absolute inset-x-0 bottom-0 h-12 w-full text-white md:h-16"
      >
        <path
          d="M0 40c120 26 240 34 360 22S600 18 720 22s240 34 360 34 240-22 360-30v54H0Z"
          fill="currentColor"
        />
      </svg>
    </section>
  );
}
