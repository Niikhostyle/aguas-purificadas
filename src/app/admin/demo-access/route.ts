import { NextResponse } from "next/server";
import { DEMO_TENANT_SLUG, ensureDemoAdminSession, isDemoTenantSlug } from "@/lib/auth";
import { platformUrl } from "@/lib/platform-url";
import { getHostTenantSlug, getTenantSlugFromHeaders } from "@/lib/tenant";

// Relative Location: behind the proxy request.url is the container address (0.0.0.0:3000).
function redirectTo(location: string) {
  return new NextResponse(null, { status: 307, headers: { Location: location } });
}

/**
 * Credential-free entry to the public demo company admin.
 * Always mints a session for tenant `demo` (never plataforma / super-admin), and only on
 * the demo subdomain so the session cookie never lands on the apex or another tenant host.
 */
export async function GET() {
  if (!isDemoTenantSlug(await getHostTenantSlug())) {
    const slug = await getTenantSlugFromHeaders();
    if (slug && !isDemoTenantSlug(slug)) return redirectTo("/admin/login");
    return redirectTo(platformUrl("/admin/demo-access", DEMO_TENANT_SLUG));
  }

  const result = await ensureDemoAdminSession();
  if (!result.ok) {
    return redirectTo(`/admin/login?tenant=demo&error=${encodeURIComponent(result.error)}`);
  }
  return redirectTo("/admin");
}
