import { Suspense } from "react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { SiteFooter } from "@/components/storefront/site-footer";
import { SiteHeader } from "@/components/storefront/site-header";
import { WhatsappFloat } from "@/components/storefront/whatsapp-float";
import { baseColors, storefrontThemeVars, tenantAppearance } from "@/lib/appearance";
import { getResolvedCart } from "@/lib/cart";
import { getCustomerSession } from "@/lib/customer-auth";
import { parseModuleFlags, parseModulesContent } from "@/lib/modules";
import { requireTenant } from "@/lib/tenant";
import { tenantWhatsappHref } from "@/lib/whatsapp";

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await requireTenant();
  const favicon = tenantAppearance(tenant).images.faviconUrl;
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
  const content = parseModulesContent(tenant.modulesContent);
  const customer = flags.loginClientes
    ? await getCustomerSession(tenant.id)
    : null;

  const h = await headers();
  const host = (h.get("host") || "").split(":")[0].toLowerCase();
  const isDemo = host.startsWith("demo.") || tenant.slug === "demo";
  const brandName = isDemo ? "Demo" : tenant.name;

  return (
    <div style={theme} data-storefront className="flex min-h-full flex-1 flex-col">
      <Suspense
        fallback={
          <div className="h-24 border-b border-[#d5e3ec] bg-[var(--header-bg)]" aria-hidden />
        }
      >
        <SiteHeader
          brandName={brandName}
          logoUrl={tenant.logoUrl}
          deliveryBanner={tenant.deliveryBanner}
          hoursBanner={tenant.hoursBanner}
          cartCount={cart.itemCount}
          flags={flags}
          regions={content.regions}
          customerName={customer?.name}
        />
      </Suspense>
      <main className="flex-1">{children}</main>
      <SiteFooter tenant={tenant} logoDarkUrl={appearance.images.logoDarkUrl} />
      <WhatsappFloat
        href={tenantWhatsappHref(
          tenant.whatsapp,
          `Hola ${tenant.name}, quiero hacer una consulta.`,
        )}
      />
    </div>
  );
}
