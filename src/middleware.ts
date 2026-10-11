import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { platformUrl } from "@/lib/platform-url";
import { applySecurityHeaders } from "@/lib/security-headers";

const TENANT_HEADER = "x-tenant-slug";
const TENANT_FROM_HOST_HEADER = "x-tenant-from-host";
const PLATFORM_HEADER = "x-platform-host";
const DEMO_TENANT_SLUG = "demo";

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
function resolveTenantSlug(request: NextRequest): {
  slug: string | null;
  fromHost: boolean;
} {
  const host = request.headers.get("host") || "";
  const hostname = (host.split(":")[0] || "").toLowerCase();

  if (!isPlatformHost(hostname)) {
    const parts = hostname.split(".");
    const isLocalhostSub = hostname.endsWith(".localhost");
    if (isLocalhostSub || parts.length >= 3) {
      let sub = parts[0];
      if (sub && sub !== "www" && sub !== "app") {
        sub = sub.toLowerCase();
        if (sub === "plataforma") return { slug: null, fromHost: false };
        return { slug: sub, fromHost: true };
      }
    }
  }

  const fromQuery = request.nextUrl.searchParams.get("tenant");
  if (fromQuery) {
    const q = fromQuery.toLowerCase();
    return { slug: q === "plataforma" ? null : q, fromHost: false };
  }

  const fromHeader = request.headers.get("x-tenant");
  if (fromHeader) {
    const h = fromHeader.toLowerCase();
    return { slug: h === "plataforma" ? null : h, fromHost: false };
  }

  return { slug: null, fromHost: false };
}

/** Absolute URL for middleware rewrite/redirect with a public host. */
function publicAbsoluteUrl(request: NextRequest, pathname: string): URL {
  const url = request.nextUrl.clone();
  url.pathname = pathname;

  const forwardedHost = (
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    ""
  )
    .split(",")[0]
    ?.trim();
  const hostname = (forwardedHost || "").replace(/:\d+$/, "").toLowerCase();
  const unusable =
    !hostname ||
    hostname === "0.0.0.0" ||
    hostname === "::" ||
    hostname === "[::]";

  if (forwardedHost && !unusable) {
    url.host = forwardedHost;
    const proto = (
      request.headers.get("x-forwarded-proto") || ""
    )
      .split(",")[0]
      ?.trim()
      .toLowerCase();
    if (proto === "http" || proto === "https") {
      url.protocol = `${proto}:`;
    } else if (process.env.NODE_ENV === "production") {
      url.protocol = "https:";
    }
    return url;
  }

  const appUrl = process.env.APP_URL?.trim();
  if (appUrl) {
    try {
      const base = new URL(appUrl);
      url.protocol = base.protocol;
      url.host = base.host;
      return url;
    } catch {
      /* ignore */
    }
  }

  return url;
}

export function middleware(request: NextRequest) {
  const { slug, fromHost } = resolveTenantSlug(request);
  const host = request.headers.get("host") || "";
  const hostname = (host.split(":")[0] || "").toLowerCase();
  const platformHost = isPlatformHost(hostname) && !slug;
  const { pathname } = request.nextUrl;

  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete(TENANT_HEADER);
  requestHeaders.delete(TENANT_FROM_HOST_HEADER);
  requestHeaders.delete(PLATFORM_HEADER);
  if (slug) {
    requestHeaders.set(TENANT_HEADER, slug);
    if (fromHost) requestHeaders.set(TENANT_FROM_HOST_HEADER, "1");
  }
  if (platformHost) {
    requestHeaders.set(PLATFORM_HEADER, "1");
  }

  // Apex marketing: keep URL `/` but serve /mibidon landing.
  // Next.js 16 middleware rewrites require absolute URLs. Build one from the
  // public Host / x-forwarded-* (never the Docker bind address 0.0.0.0).
  if (platformHost && pathname === "/") {
    return applySecurityHeaders(
      NextResponse.rewrite(publicAbsoluteUrl(request, "/mibidon"), {
        request: { headers: requestHeaders },
      }),
    );
  }

  // Storefront routes without a tenant → demo account area, else marketing home
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
    const isCuenta = pathname === "/cuenta" || pathname.startsWith("/cuenta/");
    const location = isCuenta
      ? platformUrl(pathname, DEMO_TENANT_SLUG)
      : platformUrl("/");
    return applySecurityHeaders(
      new NextResponse(null, { status: 307, headers: { Location: location } }),
    );
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
