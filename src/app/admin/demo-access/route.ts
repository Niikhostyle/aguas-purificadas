import { NextResponse } from "next/server";
import { DEMO_TENANT_SLUG, ensureDemoAdminSession, isDemoTenantSlug } from "@/lib/auth";
import { getTenantSlugFromHeaders } from "@/lib/tenant";

// Relative Location: behind the proxy request.url is the container address (0.0.0.0:3000).
function redirectTo(location: string) {
  return new NextResponse(null, { status: 307, headers: { Location: location } });
}

/**
 * Credential-free entry to the public demo company admin.
 * Always mints a session for tenant `demo` (never plataforma / super-admin), and only on
 * the demo subdomain so the session cookie never lands on the apex or another tenant host.
 */
export async function GET(request: Request) {
  const host = (request.headers.get("x-forwarded-host") || request.headers.get("host") || "").toLowerCase();
  const onDemoHost = host.startsWith(`${DEMO_TENANT_SLUG}.`);

  if (!onDemoHost) {
    const headerSlug = await getTenantSlugFromHeaders();
    if (headerSlug && !isDemoTenantSlug(headerSlug) && host.split(".").length >= 3) {
      return redirectTo("/admin/login");
    }
    const proto = request.headers.get("x-forwarded-proto") || (process.env.NODE_ENV === "production" ? "https" : "http");
    const base = host.replace(/^www\./, "");
    return redirectTo(`${proto}://${DEMO_TENANT_SLUG}.${base}/admin/demo-access`);
  }

  const result = await ensureDemoAdminSession();
  if (!result.ok) {
    return redirectTo(`/admin/login?tenant=demo&error=${encodeURIComponent(result.error)}`);
  }
  return redirectTo("/admin");
}
