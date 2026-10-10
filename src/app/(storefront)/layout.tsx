import { SiteFooter } from "@/components/storefront/site-footer";
import { SiteHeader } from "@/components/storefront/site-header";
import { requireTenant } from "@/lib/tenant";

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tenant = await requireTenant();

  return (
    <>
      <SiteHeader tenant={tenant} />
      <main className="flex-1">{children}</main>
      <SiteFooter tenant={tenant} />
    </>
  );
}
