import Link from "next/link";
import { ArrowRight, BadgeCheck, Check } from "lucide-react";
import type {
  Audience,
  CertificationItem,
  KitItem,
  ModulesContent,
  ModuleFlags,
  PlanItem,
  SocialEmbed,
} from "@/lib/modules";
import { forAudience } from "@/lib/modules";
import { OffersCarousel, type PromoCard } from "@/components/storefront/offers-carousel";
import { Reveal } from "@/components/storefront/reveal";

function youtubeEmbed(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) {
      const id = u.pathname.slice(1);
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
    }
    const id = u.searchParams.get("v");
    if (id) return `https://www.youtube-nocookie.com/embed/${id}`;
  } catch {
    return null;
  }
  return null;
}

export function AudienceHeroBand({
  audience,
  content,
}: {
  audience: Audience;
  content: ModulesContent;
}) {
  const copy = audience === "empresa" ? content.empresa : content.hogar;
  if (!copy?.headline && !copy?.body) return null;
  return (
    <Reveal>
      <section className="border-b border-[var(--sf-line)] bg-[linear-gradient(180deg,var(--mist)_0%,#ffffff_100%)] py-12">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <p className="sf-eyebrow">
            {audience === "empresa" ? "Para empresas" : "Para el hogar"}
          </p>
          {copy.headline ? (
            <h2 className="rc-display mt-2 max-w-2xl text-3xl uppercase text-[var(--brand-deep)] md:text-4xl">
              {copy.headline}
            </h2>
          ) : null}
          {copy.body ? (
            <p className="mt-3 max-w-2xl text-base text-[#5a6578]">{copy.body}</p>
          ) : null}
          {copy.ctaHref && copy.ctaLabel ? (
            <Link
              href={copy.ctaHref}
              className="group mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--brand-deep)] px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-white shadow-[var(--sf-shadow-md)] transition duration-300 hover:-translate-y-0.5 hover:bg-[var(--brand)] active:translate-y-0 active:scale-[0.98]"
            >
              {copy.ctaLabel}
            </Link>
          ) : null}
        </div>
      </section>
    </Reveal>
  );
}

/** Promo cards for active discounts where the admin added banner text or an image. */
export function DescuentosSection({
  flags,
  offers,
}: {
  flags: ModuleFlags;
  offers: PromoCard[];
}) {
  if (!flags.descuentos || !offers.length) return null;
  return (
    <Reveal>
      <section id="descuentos" className="mx-auto max-w-6xl px-4 py-16 md:px-6">
        <h2 className="sf-title rc-display text-center text-4xl uppercase text-[var(--brand-deep)] md:text-5xl">
          Descuentos
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-center text-sm text-[#5a6578]">
          Ofertas vigentes en la tienda.
        </p>
        <div className="mt-8">
          <OffersCarousel offers={offers} />
        </div>
      </section>
    </Reveal>
  );
}

export function PlanesSection({
  flags,
  content,
  audience,
}: {
  flags: ModuleFlags;
  content: ModulesContent;
  audience: Audience;
}) {
  if (!flags.planes) return null;
  const planes = forAudience(content.planes, audience);
  if (!planes.length) return null;
  return (
    <Reveal>
      <section
        id="planes"
        className="border-y border-[var(--sf-line)] bg-[linear-gradient(180deg,var(--mist)_0%,#fff_100%)] py-16 md:py-20"
      >
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <h2 className="sf-title rc-display text-center text-4xl uppercase text-[var(--brand-deep)] md:text-5xl">
            Planes
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-sm text-[#5a6578]">
            Suscripciones y rutas fijas. Activa o edita desde el admin.
          </p>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {planes.map((p: PlanItem) => (
              <article
                key={p.id}
                className={`sf-card sf-card-hover relative flex flex-col p-6 ${
                  p.highlighted
                    ? "border-[var(--brand)] shadow-[var(--sf-shadow-lg)] ring-1 ring-[var(--brand)]"
                    : ""
                }`}
              >
                <h3 className="rc-display text-2xl uppercase text-[var(--brand-deep)]">
                  {p.name}
                </h3>
                <p className="mt-2 text-lg font-bold text-[var(--brand)]">
                  {p.priceLabel}
                </p>
                {p.description ? (
                  <p className="mt-2 text-sm text-[#5a6578]">{p.description}</p>
                ) : null}
                <ul className="mt-4 flex-1 space-y-2 text-sm text-[#3d4a5c]">
                  {p.features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <Check className="mt-0.5 size-4 shrink-0 text-[var(--brand)]" aria-hidden />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                {p.ctaHref && p.ctaLabel ? (
                  <Link
                    href={p.ctaHref}
                    className="mt-6 inline-flex justify-center rounded-full bg-[var(--brand-deep)] px-4 py-2.5 text-sm font-bold uppercase text-white transition duration-300 hover:bg-[var(--brand)] active:scale-[0.98]"
                  >
                    {p.ctaLabel}
                  </Link>
                ) : null}
              </article>
            ))}
          </div>
        </div>
      </section>
    </Reveal>
  );
}

export function KitsSection({
  flags,
  content,
  audience,
}: {
  flags: ModuleFlags;
  content: ModulesContent;
  audience: Audience;
}) {
  if (!flags.kits) return null;
  const kits = forAudience(content.kits, audience);
  if (!kits.length) return null;
  return (
    <Reveal>
      <section id="kits" className="mx-auto max-w-6xl px-4 py-16 md:px-6">
        <h2 className="sf-title rc-display text-center text-4xl uppercase text-[var(--brand-deep)] md:text-5xl">
          Kits
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-center text-sm text-[#5a6578]">
          Paquetes para quienes ya trabajan con nosotros y para quienes empiezan.
        </p>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {kits.map((k: KitItem) => (
            <article key={k.id} className="sf-card sf-card-hover group overflow-hidden">
              {k.imageUrl ? (
                <div className="overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={k.imageUrl}
                    alt=""
                    loading="lazy"
                    className="h-44 w-full object-cover transition duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
                  />
                </div>
              ) : null}
              <div className="p-5">
                <h3 className="rc-display text-xl uppercase text-[var(--brand-deep)]">
                  {k.title}
                </h3>
                {k.description ? (
                  <p className="mt-2 text-sm text-[#5a6578]">{k.description}</p>
                ) : null}
                <div className="mt-4 flex items-center justify-between gap-3">
                  {k.priceLabel ? (
                    <span className="font-bold text-[var(--brand)]">{k.priceLabel}</span>
                  ) : (
                    <span />
                  )}
                  {k.href ? (
                    <Link
                      href={k.href}
                      className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-bold uppercase text-[var(--brand-deep)] transition hover:bg-[var(--mist)] hover:text-[var(--brand)]"
                    >
                      Ver
                      <ArrowRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden />
                    </Link>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </Reveal>
  );
}

export function RedesSection({
  flags,
  content,
}: {
  flags: ModuleFlags;
  content: ModulesContent;
}) {
  if (!flags.redes) return null;
  const items = content.redes;
  if (!items.length) return null;
  return (
    <Reveal>
      <section id="redes" className="relative overflow-hidden bg-[radial-gradient(120%_80%_at_50%_0%,color-mix(in_srgb,var(--brand-deep)_70%,#051b3f)_0%,#051b3f_70%)] py-16 text-white md:py-20">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <h2 className="sf-title rc-display text-center text-4xl uppercase md:text-5xl">Redes</h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-sm text-white/70">
            Historias y videos de la marca. Configura URLs en el admin.
          </p>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {items.map((s: SocialEmbed) => {
              const embed = s.platform === "youtube" ? youtubeEmbed(s.url) : null;
              return (
                <article
                  key={s.id}
                  className="overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/15 transition duration-500 hover:bg-white/10 hover:ring-white/30"
                >
                  {embed ? (
                    <div className="aspect-video w-full">
                      <iframe
                        src={embed}
                        title={s.title || "Video"}
                        className="h-full w-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        loading="lazy"
                      />
                    </div>
                  ) : (
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      {s.thumbnailUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={s.thumbnailUrl}
                          alt=""
                          className="aspect-video w-full object-cover opacity-90 transition hover:opacity-100"
                        />
                      ) : (
                        <div className="flex aspect-video items-center justify-center bg-[var(--brand)]/30 text-sm font-bold uppercase">
                          {s.platform}
                        </div>
                      )}
                    </a>
                  )}
                  {s.title ? (
                    <p className="px-4 py-3 text-sm font-semibold">{s.title}</p>
                  ) : null}
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </Reveal>
  );
}

export function CertificacionesSection({
  flags,
  content,
}: {
  flags: ModuleFlags;
  content: ModulesContent;
}) {
  if (!flags.certificaciones) return null;
  const items = content.certificaciones;
  if (!items.length) return null;
  return (
    <Reveal>
      <section id="certificaciones" className="mx-auto max-w-6xl px-4 py-16 md:px-6">
        <h2 className="sf-title rc-display text-center text-4xl uppercase text-[var(--brand-deep)] md:text-5xl">
          Certificaciones
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-center text-sm text-[#5a6578]">
          Confianza y estándares que puedes comunicar a tus clientes.
        </p>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {items.map((c: CertificationItem) => (
            <article
              key={c.id}
              className="sf-card sf-card-hover flex flex-col items-center px-5 py-8 text-center"
            >
              {c.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={c.logoUrl}
                  alt=""
                  className="mb-4 h-14 w-auto object-contain"
                />
              ) : (
                <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-[var(--mist)] text-[var(--brand)] ring-1 ring-[color-mix(in_srgb,var(--brand)_25%,transparent)]">
                  <BadgeCheck className="size-7" aria-hidden />
                </div>
              )}
              <h3 className="font-bold text-[var(--brand-deep)]">{c.name}</h3>
              {c.description ? (
                <p className="mt-2 text-sm text-[#5a6578]">{c.description}</p>
              ) : null}
            </article>
          ))}
        </div>
      </section>
    </Reveal>
  );
}
