import { Suspense } from "react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { SiteFooter } from "@/components/storefront/site-footer";
import { SiteHeader } from "@/components/storefront/site-header";
import { WhatsappFloat } from "@/components/storefront/whatsapp-float";
import { baseColors, storefrontThemeVars, tenantAppearance } from "@/lib/appearance";
import { getResolvedCart } from "@/lib/cart";
import { getCustomerSession } from "@/lib/customer-auth";
import { parseModuleFlags } from "@/lib/modules";
import {
  coverageCopy,
  hasAudienceContent,
  monogramFaviconDataUri,
  storefrontModulesContent,
  topbarMessages,
  usesTemplateShowcase,
} from "@/lib/storefront-defaults";
import { requireTenant } from "@/lib/tenant";
import { tenantWhatsappHref } from "@/lib/whatsapp";

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await requireTenant();
  const appearance = tenantAppearance(tenant);
  const favicon =
    appearance.images.faviconUrl ??
    (tenant.logoUrl ? undefined : monogramFaviconDataUri(tenant.name, baseColors(tenant).primary));
  return favicon ? { icons: { icon: favicon, apple: favicon } } : {};
}

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tenant = await requireTenant();
  const appearance = tenantAppearance(tenant);
  const theme = storefrontThemeVars(baseColors(tenant), appearance);
  const cart = await getResolvedCart(tenant.id);
  const flags = parseModuleFlags(tenant.modulesEnabled);
  const customer = flags.loginClientes
    ? await getCustomerSession(tenant.id)
    : null;

  const h = await headers();
  const host = (h.get("host") || "").split(":")[0].toLowerCase();
  const isDemo = host.startsWith("demo.") || tenant.slug === "demo";
  const brandName = isDemo ? "Demo" : tenant.name;
  const showcase = usesTemplateShowcase(tenant);
  const content = storefrontModulesContent(tenant, isDemo);

  return (
    <div style={theme} data-storefront className="flex min-h-full flex-1 flex-col">
      <Suspense
        fallback={
          <div className="h-24 border-b border-[var(--sf-line)] bg-[var(--header-bg)]" aria-hidden />
        }
      >
        <SiteHeader
          brandName={brandName}
          logoUrl={tenant.logoUrl}
          brandSubtitle={tenant.logoUrl ? null : "Agua purificada"}
          topbar={topbarMessages(tenant, showcase)}
          cartCount={cart.itemCount}
          flags={flags}
          sections={{
            descuentos: content.descuentos.length > 0,
            planes: content.planes.length > 0,
            kits: content.kits.length > 0,
          }}
          showAudienceToggle={showcase || hasAudienceContent(content)}
          regions={content.regions}
          customerName={customer?.name}
        />
      </Suspense>
      <main className="flex-1">{children}</main>
      <SiteFooter
        tenant={tenant}
        logoDarkUrl={appearance.images.logoDarkUrl}
        coverage={coverageCopy(tenant, showcase)}
      />
      <WhatsappFloat
        href={tenantWhatsappHref(
          tenant.whatsapp,
          `Hola ${tenant.name}, quiero hacer una consulta.`,
        )}
      />
    </div>
  );
}
