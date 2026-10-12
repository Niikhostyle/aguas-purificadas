import type { Tenant } from "@prisma/client";
import {
  defaultDemoModulesContent,
  parseModulesContent,
  type ModulesContent,
} from "./modules";

/**
 * Demo and the Río Claro clone keep the original template (photos, copy, cities).
 * Every other tenant gets neutral, brand-free defaults until it configures its own.
 */
const SHOWCASE_SLUGS = new Set(["demo", "rio-claro"]);
export const TEMPLATE_ASSET_PREFIX = "/brand/rio-claro/";

export function usesTemplateShowcase(tenant: Pick<Tenant, "slug" | "logoUrl">): boolean {
  if (SHOWCASE_SLUGS.has(tenant.slug)) return true;
  return Boolean(tenant.logoUrl?.startsWith(TEMPLATE_ASSET_PREFIX));
}

export function isTemplateAsset(url: string | null | undefined): boolean {
  return Boolean(url?.startsWith(TEMPLATE_ASSET_PREFIX));
}

/** Module content as rendered by the storefront (demo falls back to the sample content). */
export function storefrontModulesContent(
  tenant: Pick<Tenant, "modulesContent">,
  isDemo: boolean,
): ModulesContent {
  const content = parseModulesContent(tenant.modulesContent);
  if (isDemo && !content.planes.length && !content.kits.length) {
    return defaultDemoModulesContent();
  }
  return content;
}

export function emptyModulesContent(): ModulesContent {
  return {
    regions: [],
    planes: [],
    kits: [],
    redes: [],
    certificaciones: [],
    beneficios: [],
  };
}

/** True when the Hogar / Empresa toggle would actually change something on the page. */
export function hasAudienceContent(content: ModulesContent): boolean {
  if (content.hogar?.headline || content.hogar?.body) return true;
  if (content.empresa?.headline || content.empresa?.body) return true;
  return [...content.planes, ...content.kits].some(
    (i) => i.audience === "hogar" || i.audience === "empresa",
  );
}

const MINOR_WORDS = new Set(["de", "del", "la", "las", "el", "los", "y", "e", "spa", "ltda", "limitada"]);

/** "Jimena Leiva" → "JL", "Aguas del Sur SpA" → "AS", "Cristal" → "CR". */
export function brandInitials(name: string): string {
  const words = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9ñÑ ]+/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  const main = words.filter((w) => !MINOR_WORDS.has(w.toLowerCase()));
  const pick = main.length ? main : words;
  if (!pick.length) return "A";
  if (pick.length === 1) return pick[0].slice(0, 2).toUpperCase();
  return (pick[0][0] + pick[1][0]).toUpperCase();
}

/** Square monogram used as favicon when the tenant has neither favicon nor logo. */
export function monogramFaviconDataUri(name: string, bg: string, fg = "#ffffff"): string {
  const initials = brandInitials(name);
  const size = initials.length > 1 ? 28 : 34;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="${bg}"/><text x="32" y="33" text-anchor="middle" dominant-baseline="central" font-family="Arial,Helvetica,sans-serif" font-weight="700" font-size="${size}" fill="${fg}">${initials}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

const SHOWCASE_DELIVERY =
  "Despacho a comunas seleccionadas. Elegí tu ciudad para confirmar cobertura.";
const SHOWCASE_HOURS =
  "Horario de atención: Lunes a Viernes 8:30–17:30 · Sábado 09:00–13:00";
const SHOWCASE_COVERAGE =
  "Nos esmeramos día a día por nuestros clientes, sabemos que para ellos el agua debe llegar a tiempo. Despacho a Talca, Curicó, Linares y comunas de la región.";

export type TopbarMessages = { delivery?: string; hours?: string };

export function topbarMessages(
  tenant: Pick<Tenant, "deliveryBanner" | "hoursBanner" | "city">,
  showcase: boolean,
): TopbarMessages {
  if (showcase) {
    return {
      delivery: tenant.deliveryBanner || SHOWCASE_DELIVERY,
      hours: tenant.hoursBanner || SHOWCASE_HOURS,
    };
  }
  const city = tenant.city?.trim();
  return {
    delivery:
      tenant.deliveryBanner?.trim() ||
      (city ? `Despacho a domicilio en ${city}` : "Despacho a domicilio"),
    hours: tenant.hoursBanner?.trim() || undefined,
  };
}

export function coverageCopy(
  tenant: Pick<Tenant, "coverageText" | "city">,
  showcase: boolean,
): string {
  if (tenant.coverageText?.trim()) return tenant.coverageText;
  if (showcase) return SHOWCASE_COVERAGE;
  const city = tenant.city?.trim();
  return city
    ? `Despachamos en ${city} y alrededores. Escríbenos para confirmar si llegamos a tu comuna.`
    : "Escríbenos para confirmar si llegamos a tu comuna.";
}

/** Texts that only ever came from the template (seed, bootstrap, old fallbacks). */
export const TEMPLATE_TEXTS = new Set(
  [
    SHOWCASE_DELIVERY,
    SHOWCASE_HOURS,
    SHOWCASE_COVERAGE,
    "Despacho a comunas seleccionadas. Elegí tu ciudad en el selector de región.",
    "Despacho a comunas seleccionadas. Elegí tu ciudad en el selector.",
    "Horario: Lunes a Viernes 8:30–17:30 · Sábado 09:00–13:00",
    "Cobertura demo en Santiago, Valparaíso, Maule, Biobío y Araucanía.",
    "Cobertura demo en principales ciudades de Chile.",
    "Purificación multietapas, libre de sodio. Pedí online, elegí tu ciudad y recibí en ruta.",
  ].map((t) => t.trim()),
);

type WithId = { id: string };

function stripMatching<T extends WithId>(items: T[], template: T[], key: (t: T) => string): T[] {
  const known = new Set(template.map((t) => `${t.id}::${key(t)}`));
  return items.filter((i) => !known.has(`${i.id}::${key(i)}`));
}

/**
 * Removes the sample items `defaultDemoModulesContent()` used to copy into every new tenant,
 * keeping anything the tenant added or edited itself.
 */
export function stripTemplateModulesContent(content: ModulesContent): ModulesContent {
  const demo = defaultDemoModulesContent();
  const sameCopy = (a?: ModulesContent["hogar"], b?: ModulesContent["hogar"]) =>
    !!a && !!b && a.headline === b.headline && a.body === b.body;
  return {
    regions: stripMatching(content.regions, demo.regions, (r) => r.name),
    planes: stripMatching(content.planes, demo.planes, (p) => p.name),
    kits: stripMatching(content.kits, demo.kits, (k) => k.title),
    redes: stripMatching(content.redes, demo.redes, (s) => s.url),
    certificaciones: stripMatching(content.certificaciones, demo.certificaciones, (c) => c.name),
    beneficios: stripMatching(content.beneficios, demo.beneficios, (b) => b.title),
    beneficiosTitle: content.beneficiosTitle,
    hogar: sameCopy(content.hogar, demo.hogar) ? undefined : content.hogar,
    empresa: sameCopy(content.empresa, demo.empresa) ? undefined : content.empresa,
  };
}
