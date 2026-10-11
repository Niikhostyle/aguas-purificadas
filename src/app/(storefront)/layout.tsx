import { Suspense } from "react";
import { headers } from "next/headers";
import { SiteFooter } from "@/components/storefront/site-footer";
import { SiteHeader } from "@/components/storefront/site-header";
import { tenantThemeStyle } from "@/lib/branding";
import { getResolvedCart } from "@/lib/cart";
import { getCustomerSession } from "@/lib/customer-auth";
import { parseModuleFlags, parseModulesContent } from "@/lib/modules";
import { requireTenant } from "@/lib/tenant";

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tenant = await requireTenant();
  const theme = tenantThemeStyle(tenant);
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
    <div style={theme} className="flex min-h-full flex-1 flex-col">
      <Suspense
        fallback={
          <div className="h-24 border-b border-[#d5e3ec] bg-white" aria-hidden />
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
      <SiteFooter tenant={tenant} />
    </div>
  );
}
