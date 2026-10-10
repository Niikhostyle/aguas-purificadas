import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const TENANT_HEADER = "x-tenant-slug";

/**
 * Tenant resolution order (local-friendly):
 * 1. Subdomain: rio-claro.localhost:PORT → rio-claro
 * 2. Query: ?tenant=rio-claro (also set as cookie for subsequent navigations)
 * 3. Header: x-tenant: rio-claro
 * 4. Cookie: aguas_tenant
 * 5. Env default: DEFAULT_TENANT_SLUG (baked via middleware matcher + fallback)
 *
 * For local demo we rely on DEFAULT_TENANT_SLUG=rio-claro so http://127.0.0.1:PORT
 * works without hosts file changes. Override with ?tenant=other-slug anytime.
 */
function resolveTenantSlug(request: NextRequest): string | null {
  const host = request.headers.get("host") || "";
  const hostname = host.split(":")[0] || "";

  // Subdomain: slug.localhost or slug.example.com (ignore www / bare localhost / IPs)
  const parts = hostname.split(".");
  if (
    parts.length >= 2 &&
    hostname !== "localhost" &&
    !/^\d+\.\d+\.\d+\.\d+$/.test(hostname)
  ) {
    const sub = parts[0];
    if (sub && sub !== "www" && sub !== "app") {
      return sub.toLowerCase();
    }
  }

  const fromQuery = request.nextUrl.searchParams.get("tenant");
  if (fromQuery) return fromQuery.toLowerCase();

  const fromHeader = request.headers.get("x-tenant");
  if (fromHeader) return fromHeader.toLowerCase();

  const fromCookie = request.cookies.get("aguas_tenant")?.value;
  if (fromCookie) return fromCookie.toLowerCase();

  const fromEnv = process.env.DEFAULT_TENANT_SLUG;
  if (fromEnv) return fromEnv.toLowerCase();

  return null;
}

export function middleware(request: NextRequest) {
  const slug = resolveTenantSlug(request);
  const requestHeaders = new Headers(request.headers);

  if (slug) {
    requestHeaders.set(TENANT_HEADER, slug);
  }

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  // Persist ?tenant= for subsequent page loads
  const fromQuery = request.nextUrl.searchParams.get("tenant");
  if (fromQuery) {
    response.cookies.set("aguas_tenant", fromQuery.toLowerCase(), {
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
    });
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all paths except static assets and Next internals.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
