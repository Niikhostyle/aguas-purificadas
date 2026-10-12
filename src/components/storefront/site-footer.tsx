import type { Tenant } from "@prisma/client";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { BrandMark } from "@/components/storefront/brand-mark";
import { formatChileWhatsapp, tenantWhatsappHref } from "@/lib/whatsapp";

export function SiteFooter({
  tenant,
  logoDarkUrl,
  coverage,
}: {
  tenant: Tenant;
  logoDarkUrl?: string;
  coverage: string;
}) {
  const phones = [tenant.phone, tenant.phoneSecondary].filter(Boolean);
  const whatsapp = tenantWhatsappHref(tenant.whatsapp);
  const hasContact = phones.length > 0 || Boolean(whatsapp) || Boolean(tenant.email);

  return (
    <footer
      id="contacto"
      className="relative mt-auto overflow-hidden bg-[var(--footer-bg)] text-[var(--footer-text)]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,color-mix(in_srgb,var(--footer-text)_35%,transparent),transparent)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-32 size-80 rounded-full bg-[var(--brand)] opacity-[0.12] blur-3xl"
      />
      <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-3 md:px-6">
        <div>
          {logoDarkUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoDarkUrl}
              alt={tenant.name}
              className="mb-4 h-14 w-auto object-contain"
            />
          ) : tenant.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={tenant.logoUrl}
              alt={tenant.name}
              className="mb-4 h-14 w-auto brightness-0 invert"
            />
          ) : (
            <BrandMark name={tenant.name} tone="dark" size="lg" />
          )}
          {tenant.tagline ? (
            <p className="mt-2 max-w-xs text-sm leading-relaxed opacity-80">{tenant.tagline}</p>
          ) : null}
        </div>
        <div>
          <p className="rc-display text-xl uppercase tracking-wide">
            {phones.length ? "Llámanos" : "Contacto"}
          </p>
          {phones.length ? (
            <ul className="mt-3 space-y-1.5 text-lg font-bold">
              {phones.map((p) => (
                <li key={p}>
                  <a
                    href={`tel:${p}`}
                    className="group inline-flex items-center gap-2 rounded-md transition-opacity hover:opacity-80"
                  >
                    <Phone className="size-4 opacity-70 transition-transform duration-300 group-hover:-rotate-12" aria-hidden />
                    {p}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
          {whatsapp ? (
            <a
              href={whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-2 text-sm font-bold text-white shadow-[0_10px_24px_-12px_rgba(37,211,102,0.9)] transition duration-300 hover:-translate-y-0.5 hover:bg-[#1ebe5b] active:translate-y-0"
            >
              <MessageCircle className="size-4" aria-hidden />
              WhatsApp {formatChileWhatsapp(tenant.whatsapp)}
            </a>
          ) : null}
          {tenant.email ? (
            <p className="mt-4 text-sm opacity-80">
              <a
                href={`mailto:${tenant.email}`}
                className="inline-flex items-center gap-2 underline-offset-4 hover:underline"
              >
                <Mail className="size-4" aria-hidden />
                {tenant.email}
              </a>
            </p>
          ) : null}
          {!hasContact ? (
            <p className="mt-3 text-sm opacity-80">Pronto publicaremos nuestros datos de contacto.</p>
          ) : null}
        </div>
        <div>
          <p className="rc-display text-xl uppercase tracking-wide">Cobertura</p>
          <p className="mt-3 flex gap-2 text-sm leading-relaxed opacity-80">
            <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>{coverage}</span>
          </p>
        </div>
      </div>
      <div className="relative border-t border-[color-mix(in_srgb,var(--footer-text)_12%,transparent)] px-4 py-4 text-center text-xs opacity-60">
        {tenant.name} · plataforma Aguas Purificadas
      </div>
    </footer>
  );
}
