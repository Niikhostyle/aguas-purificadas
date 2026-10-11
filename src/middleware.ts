import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { applySecurityHeaders } from "@/lib/security-headers";

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
 * 1. Subdomain: demo.mibidon.cl or cliente.mibidon.cl
 * 2. Query: ?tenant=demo
 * 3. Header: x-tenant
 *
 * Apex / www / bare IP never fall back to a storefront tenant —
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
        if (sub === "plataforma") return null;
        return sub;
      }
    }
  }

  const fromQuery = request.nextUrl.searchParams.get("tenant");
  if (fromQuery) {
    const q = fromQuery.toLowerCase();
    if (q === "plataforma") return null;
    return q;
  }

  const fromHeader = request.headers.get("x-tenant");
  if (fromHeader) {
    const h = fromHeader.toLowerCase();
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
    // Path-only rewrite. Cloning request.nextUrl keeps the Docker bind host
    // (0.0.0.0:3000); if that absolute URL ever diverges from the public Host,
    // Next treats the rewrite as an external proxy and HTTPS apex returns 500.
    return applySecurityHeaders(
      NextResponse.rewrite("/mibidon", {
        request: { headers: requestHeaders },
      }),
    );
  }

  // Storefront routes without a tenant → back to marketing home
  const storefrontPrefixes = [
    "/productos",
    "/carrito",
    "/checkout",
    "/pedido",
    "/pago",
    "/cuenta",
  ];
  if (
    platformHost &&
    storefrontPrefixes.some(
      (p) => pathname === p || pathname.startsWith(`${p}/`),
    )
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return applySecurityHeaders(NextResponse.redirect(url));
  }

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  const fromQuery = request.nextUrl.searchParams.get("tenant");
  if (fromQuery && slug) {
    response.cookies.set("aguas_tenant", slug, {
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 30,
    });
  }

  return applySecurityHeaders(response);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
