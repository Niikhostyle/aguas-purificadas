import type { Tenant } from "@prisma/client";
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
    <footer id="contacto" className="mt-auto bg-[var(--footer-bg)] text-[var(--footer-text)]">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-3 md:px-6">
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
            <p className="mt-2 text-sm opacity-80">{tenant.tagline}</p>
          ) : null}
        </div>
        <div>
          <p className="rc-display text-xl uppercase tracking-wide">
            {phones.length ? "Llámanos" : "Contacto"}
          </p>
          {phones.length ? (
            <ul className="mt-3 space-y-1 text-lg font-bold">
              {phones.map((p) => (
                <li key={p}>
                  <a href={`tel:${p}`} className="hover:text-[var(--brand)]">
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
              className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-1.5 text-sm font-bold text-white hover:bg-[#1ebe5b]"
            >
              WhatsApp {formatChileWhatsapp(tenant.whatsapp)}
            </a>
          ) : null}
          {tenant.email ? (
            <p className="mt-3 text-sm opacity-80">
              <a href={`mailto:${tenant.email}`} className="hover:underline">
                {tenant.email}
              </a>
            </p>
          ) : null}
          {!hasContact ? (
            <p className="mt-3 text-sm opacity-80">Pronto publicaremos nuestros datos de contacto.</p>
          ) : null}
        </div>
        <div>
          <p className="rc-display text-xl uppercase tracking-wide">
            Cobertura
          </p>
          <p className="mt-3 text-sm leading-relaxed opacity-80">
            {coverage}
          </p>
        </div>
      </div>
      <div className="border-t border-[var(--footer-text)]/15 px-4 py-3 text-center text-xs opacity-60">
        {tenant.name} · plataforma Aguas Purificadas
      </div>
    </footer>
  );
}
