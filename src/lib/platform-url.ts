const DEV_BASE_DOMAIN = "localhost:43123";
const PROD_BASE_DOMAIN = "mibidon.cl";

function isIpHost(hostname: string): boolean {
  return /^\d+\.\d+\.\d+\.\d+$/.test(hostname) || hostname.includes(":");
}

/**
 * Fixed public base (host[:port], protocol) that tenant subdomains hang off.
 * Never derived from request headers: PLATFORM_BASE_DOMAIN, else APP_URL when it is a
 * real hostname, else mibidon.cl (prod) / localhost:43123 (dev).
 */
function platformBase(): { protocol: string; host: string } {
  const fallbackProtocol = process.env.NODE_ENV === "production" ? "https:" : "http:";

  const configured = process.env.PLATFORM_BASE_DOMAIN?.trim().toLowerCase();
  if (configured) {
    try {
      const url = new URL(/^https?:\/\//.test(configured) ? configured : `${fallbackProtocol}//${configured}`);
      return { protocol: url.protocol, host: url.host.replace(/^www\./, "") };
    } catch {
      /* ignore */
    }
  }

  const appUrl = process.env.APP_URL?.trim();
  if (appUrl) {
    try {
      const url = new URL(appUrl);
      if (!isIpHost(url.hostname)) {
        return { protocol: url.protocol, host: url.host.toLowerCase().replace(/^www\./, "") };
      }
    } catch {
      /* ignore */
    }
  }

  return {
    protocol: fallbackProtocol,
    host: process.env.NODE_ENV === "production" ? PROD_BASE_DOMAIN : DEV_BASE_DOMAIN,
  };
}

/** Absolute URL on the platform apex, or on `<subdomain>.` of it. */
export function platformUrl(pathname: string, subdomain?: string): string {
  const { protocol, host } = platformBase();
  return `${protocol}//${subdomain ? `${subdomain}.` : ""}${host}${pathname}`;
}
