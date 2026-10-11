import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const TENANT_HEADER = "x-tenant-slug";
const PLATFORM_HEADER = "x-platform-host";

/** Hosts that serve the MiBidón marketing site (not a client storefront). */
function isPlatformHost(hostname: string): boolean {
  if (!hostname) return true;
  if (hostname === "localhost" || hostname === "127.0.0.1") return true;
  if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) return true;
  if (hostname === "mibidon.cl" || hostname === "www.mibidon.cl") return true;
  return false;
}

/**
 * Tenant resolution (storefront only):
 * 1. Subdomain: rio-claro.mibidon.cl / demo.mibidon.cl → tenant slug
 * 2. Query: ?tenant=rio-claro
 * 3. Header: x-tenant
 *
 * Apex / www / bare IP never fall back to DEFAULT_TENANT_SLUG or cookie —
 * they show the MiBidón marketing landing.
 */
function resolveTenantSlug(request: NextRequest): string | null {
  const host = request.headers.get("host") || "";
  const hostname = (host.split(":")[0] || "").toLowerCase();

  if (!isPlatformHost(hostname)) {
    const parts = hostname.split(".");
    const isLocalhostSub = hostname.endsWith(".localhost");
    if (isLocalhostSub || parts.length >= 3) {
      let sub = parts[0];
      if (sub && sub !== "www" && sub !== "app") {
        sub = sub.toLowerCase();
        // Prospect demo alias
        if (sub === "demo") return "rio-claro";
        // Platform admin tenant is not a storefront
        if (sub === "plataforma") return null;
        return sub;
      }
    }
  }

  const fromQuery = request.nextUrl.searchParams.get("tenant");
  if (fromQuery) {
    const q = fromQuery.toLowerCase();
    if (q === "demo") return "rio-claro";
    if (q === "plataforma") return null;
    return q;
  }

  const fromHeader = request.headers.get("x-tenant");
  if (fromHeader) {
    const h = fromHeader.toLowerCase();
    if (h === "demo") return "rio-claro";
    if (h === "plataforma") return null;
    return h;
  }

  return null;
}

export function middleware(request: NextRequest) {
  const slug = resolveTenantSlug(request);
  const host = request.headers.get("host") || "";
  const hostname = (host.split(":")[0] || "").toLowerCase();
  const platformHost = isPlatformHost(hostname) && !slug;
  const { pathname } = request.nextUrl;

  const requestHeaders = new Headers(request.headers);
  if (slug) {
    requestHeaders.set(TENANT_HEADER, slug);
  }
  if (platformHost) {
    requestHeaders.set(PLATFORM_HEADER, "1");
  }

  // Apex marketing: keep URL `/` but serve /mibidon landing
  if (platformHost && pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/mibidon";
    return NextResponse.rewrite(url, {
      request: { headers: requestHeaders },
    });
  }

  // Storefront routes without a tenant → back to marketing home
  const storefrontPrefixes = [
    "/productos",
    "/carrito",
    "/checkout",
    "/pedido",
    "/pago",
  ];
  if (
    platformHost &&
    storefrontPrefixes.some(
      (p) => pathname === p || pathname.startsWith(`${p}/`),
    )
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  const fromQuery = request.nextUrl.searchParams.get("tenant");
  if (fromQuery && slug) {
    response.cookies.set("aguas_tenant", slug, {
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
    });
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
