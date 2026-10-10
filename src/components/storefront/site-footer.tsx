import type { Tenant } from "@prisma/client";

export function SiteFooter({ tenant }: { tenant: Tenant }) {
  return (
    <footer className="border-t border-[#c5d8d2] bg-[#e8f1ee]">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 md:grid-cols-3 md:px-8">
        <div>
          <p className="font-[family-name:var(--font-display)] text-xl text-[var(--brand-deep)]">
            {tenant.name}
          </p>
          {tenant.tagline ? (
            <p className="mt-2 text-sm text-[#4a655f]">{tenant.tagline}</p>
          ) : null}
        </div>
        <div className="text-sm text-[#2f4a44]">
          <p className="font-medium text-[var(--brand-deep)]">Contacto</p>
          {tenant.phone ? <p className="mt-2">{tenant.phone}</p> : null}
          {tenant.email ? <p>{tenant.email}</p> : null}
          {tenant.whatsapp ? <p>WhatsApp {tenant.whatsapp}</p> : null}
        </div>
        <div className="text-sm text-[#2f4a44]">
          <p className="font-medium text-[var(--brand-deep)]">Dirección</p>
          {tenant.address ? <p className="mt-2">{tenant.address}</p> : null}
          <p>
            {[tenant.city, tenant.region].filter(Boolean).join(", ")}
          </p>
        </div>
      </div>
      <div className="border-t border-[#c5d8d2] px-5 py-4 text-center text-xs text-[#4a655f]">
        Tienda demo · plataforma Aguas Purificadas
      </div>
    </footer>
  );
}
