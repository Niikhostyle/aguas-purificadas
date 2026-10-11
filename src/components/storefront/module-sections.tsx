import Link from "next/link";
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
import { OffersCarousel } from "@/components/storefront/offers-carousel";
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
      <section className="border-b border-[#e4eef4] bg-[linear-gradient(180deg,#e8f7fc_0%,#ffffff_100%)] py-10">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--brand)]">
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
              className="mt-5 inline-flex bg-[var(--brand-deep)] px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-white hover:bg-[var(--brand)]"
            >
              {copy.ctaLabel}
            </Link>
          ) : null}
        </div>
      </section>
    </Reveal>
  );
}

export function DescuentosSection({
  flags,
  content,
  audience,
}: {
  flags: ModuleFlags;
  content: ModulesContent;
  audience: Audience;
}) {
  if (!flags.descuentos) return null;
  const offers = forAudience(content.descuentos, audience);
  if (!offers.length) return null;
  return (
    <Reveal>
      <section id="descuentos" className="mx-auto max-w-6xl px-4 py-16 md:px-6">
        <h2 className="rc-display text-center text-4xl uppercase text-[var(--brand-deep)]">
          Descuentos
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-sm text-[#5a6578]">
          Ofertas activas para {audience === "empresa" ? "empresas" : "hogares"}.
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
        className="border-y border-[#e4eef4] bg-[#f7fbfd] py-16"
      >
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <h2 className="rc-display text-center text-4xl uppercase text-[var(--brand-deep)]">
            Planes
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-sm text-[#5a6578]">
            Suscripciones y rutas fijas. Activá o editá desde el admin.
          </p>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {planes.map((p: PlanItem) => (
              <article
                key={p.id}
                className={`flex flex-col rounded-2xl bg-white p-6 ring-1 ${
                  p.highlighted
                    ? "ring-[var(--brand)] shadow-lg shadow-[#00b1e2]/15"
                    : "ring-[#d5e3ec]"
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
                      <span className="text-[var(--brand)]">✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                {p.ctaHref && p.ctaLabel ? (
                  <Link
                    href={p.ctaHref}
                    className="mt-6 inline-flex justify-center bg-[var(--brand-deep)] px-4 py-2.5 text-sm font-bold uppercase text-white hover:bg-[var(--brand)]"
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
        <h2 className="rc-display text-center text-4xl uppercase text-[var(--brand-deep)]">
          Kits
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-sm text-[#5a6578]">
          Paquetes para quienes ya trabajan con nosotros y para quienes empiezan.
        </p>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {kits.map((k: KitItem) => (
            <article key={k.id} className="overflow-hidden rounded-2xl ring-1 ring-[#d5e3ec]">
              {k.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={k.imageUrl} alt="" className="h-44 w-full object-cover" />
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
                      className="text-sm font-bold uppercase text-[var(--brand-deep)] hover:text-[var(--brand)]"
                    >
                      Ver
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
      <section id="redes" className="border-t border-[#e4eef4] bg-[#051b3f] py-16 text-white">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <h2 className="rc-display text-center text-4xl uppercase">Redes</h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-sm text-white/70">
            Historias y videos de la marca. Configurá URLs en el admin.
          </p>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {items.map((s: SocialEmbed) => {
              const embed = s.platform === "youtube" ? youtubeEmbed(s.url) : null;
              return (
                <article
                  key={s.id}
                  className="overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/15"
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
        <h2 className="rc-display text-center text-4xl uppercase text-[var(--brand-deep)]">
          Certificaciones
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-sm text-[#5a6578]">
          Confianza y estándares que podés comunicar a tus clientes.
        </p>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {items.map((c: CertificationItem) => (
            <article
              key={c.id}
              className="flex flex-col items-center rounded-2xl bg-[#f7fbfd] px-5 py-8 text-center ring-1 ring-[#d5e3ec]"
            >
              {c.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={c.logoUrl}
                  alt=""
                  className="mb-4 h-14 w-auto object-contain"
                />
              ) : (
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--brand)]/15 text-lg font-bold text-[var(--brand-deep)]">
                  ✓
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
