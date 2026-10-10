import { SiteFooter } from "@/components/storefront/site-footer";
import { SiteHeader } from "@/components/storefront/site-header";
import { tenantThemeStyle } from "@/lib/branding";
import { requireTenant } from "@/lib/tenant";

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tenant = await requireTenant();
  const theme = tenantThemeStyle(tenant);

  return (
    <div style={theme} className="flex min-h-full flex-1 flex-col">
      <SiteHeader tenant={tenant} />
      <main className="flex-1">{children}</main>
      <SiteFooter tenant={tenant} />
    </div>
  );
}
