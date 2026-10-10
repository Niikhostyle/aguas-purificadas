import type { Tenant } from "@prisma/client";

export function SiteFooter({ tenant }: { tenant: Tenant }) {
  const phones = [tenant.phone, tenant.phoneSecondary].filter(Boolean);
  const coverage =
    tenant.coverageText ||
    "Nos esmeramos día a día por nuestros clientes, sabemos que para ellos el agua debe llegar a tiempo. Despacho a Talca, Curicó, Linares y comunas de la región.";

  return (
    <footer id="contacto" className="mt-auto bg-[var(--brand-deep)] text-white">
      <div
        className="bg-cover bg-center"
        style={{
          backgroundImage: tenant.heroImageUrl
            ? undefined
            : undefined,
        }}
      >
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-3 md:px-6">
          <div>
            {tenant.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={tenant.logoUrl}
                alt={tenant.name}
                className="mb-4 h-14 w-auto brightness-0 invert"
              />
            ) : (
              <p className="rc-display text-3xl uppercase">{tenant.name}</p>
            )}
            <p className="mt-2 text-sm text-white/80">{tenant.tagline}</p>
          </div>
          <div>
            <p className="rc-display text-xl uppercase tracking-wide">
              Llámanos
            </p>
            <ul className="mt-3 space-y-1 text-lg font-bold">
              {phones.length ? (
                phones.map((p) => (
                  <li key={p}>
                    <a href={`tel:${p}`} className="hover:text-[var(--brand)]">
                      {p}
                    </a>
                  </li>
                ))
              ) : (
                <li>—</li>
              )}
            </ul>
            {tenant.email ? (
              <p className="mt-3 text-sm text-white/80">{tenant.email}</p>
            ) : null}
          </div>
          <div>
            <p className="rc-display text-xl uppercase tracking-wide">
              Cobertura
            </p>
            <p className="mt-3 text-sm leading-relaxed text-white/80">
              {coverage}
            </p>
          </div>
        </div>
      </div>
      <div className="border-t border-white/15 px-4 py-3 text-center text-xs text-white/60">
        {tenant.name} · plataforma Aguas Purificadas
      </div>
    </footer>
  );
}
