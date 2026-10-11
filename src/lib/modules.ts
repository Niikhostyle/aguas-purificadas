export type ModuleFlags = {
  descuentos: boolean;
  planes: boolean;
  kits: boolean;
  redes: boolean;
  certificaciones: boolean;
  loginClientes: boolean;
  selectorRegion: boolean;
  hogarEmpresa: boolean;
  despacho: boolean;
  recordatorios: boolean;
  envases: boolean;
};

export type Audience = "hogar" | "empresa";

export type RegionOption = {
  id: string;
  name: string;
  /** Región / zona Chile */
  zone?: string;
};

export type OfferItem = {
  id: string;
  title: string;
  subtitle?: string;
  badge?: string;
  imageUrl?: string;
  href?: string;
  audience?: Audience | "ambos";
};

export type PlanItem = {
  id: string;
  name: string;
  priceLabel: string;
  description?: string;
  features: string[];
  ctaLabel?: string;
  ctaHref?: string;
  highlighted?: boolean;
  audience?: Audience | "ambos";
};

export type KitItem = {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  priceLabel?: string;
  href?: string;
  audience?: Audience | "ambos";
};

export type SocialEmbed = {
  id: string;
  platform: "youtube" | "instagram";
  title?: string;
  url: string;
  thumbnailUrl?: string;
};

export type CertificationItem = {
  id: string;
  name: string;
  description?: string;
  logoUrl?: string;
};

export type AudienceCopy = {
  headline?: string;
  body?: string;
  ctaLabel?: string;
  ctaHref?: string;
};

export type ModulesContent = {
  regions: RegionOption[];
  descuentos: OfferItem[];
  planes: PlanItem[];
  kits: KitItem[];
  redes: SocialEmbed[];
  certificaciones: CertificationItem[];
  hogar?: AudienceCopy;
  empresa?: AudienceCopy;
};

export const DEFAULT_MODULE_FLAGS: ModuleFlags = {
  descuentos: true,
  planes: true,
  kits: true,
  redes: true,
  certificaciones: true,
  loginClientes: true,
  selectorRegion: true,
  hogarEmpresa: true,
  despacho: true,
  recordatorios: true,
  envases: true,
};

export const MODULE_LABELS: Record<keyof ModuleFlags, string> = {
  descuentos: "Descuentos",
  planes: "Planes",
  kits: "Kits / paquetes",
  redes: "Redes sociales",
  certificaciones: "Certificaciones",
  loginClientes: "Login clientes",
  selectorRegion: "Selector de región",
  hogarEmpresa: "Hogar / Empresa",
  despacho: "Admin · Ruta de despacho",
  recordatorios: "Admin · Recordatorios / suscripción",
  envases: "Admin · Envases retornables",
};

export function parseModuleFlags(raw: unknown): ModuleFlags {
  const base = { ...DEFAULT_MODULE_FLAGS };
  if (!raw || typeof raw !== "object") return base;
  const o = raw as Record<string, unknown>;
  (Object.keys(base) as (keyof ModuleFlags)[]).forEach((k) => {
    if (typeof o[k] === "boolean") base[k] = o[k] as boolean;
  });
  return base;
}

function str(v: unknown): string | undefined {
  if (typeof v !== "string") return undefined;
  const t = v.trim();
  return t || undefined;
}

function audienceOf(v: unknown): Audience | "ambos" | undefined {
  if (v === "hogar" || v === "empresa" || v === "ambos") return v;
  return undefined;
}

export function parseModulesContent(raw: unknown): ModulesContent {
  const empty: ModulesContent = {
    regions: [],
    descuentos: [],
    planes: [],
    kits: [],
    redes: [],
    certificaciones: [],
  };
  if (!raw || typeof raw !== "object") return empty;
  const o = raw as Record<string, unknown>;

  const regions: RegionOption[] = [];
  if (Array.isArray(o.regions)) {
    for (const item of o.regions) {
      if (!item || typeof item !== "object") continue;
      const r = item as Record<string, unknown>;
      const name = str(r.name);
      if (!name) continue;
      regions.push({
        id: str(r.id) || `r-${regions.length + 1}`,
        name,
        zone: str(r.zone),
      });
    }
  }

  const descuentos: OfferItem[] = [];
  if (Array.isArray(o.descuentos)) {
    for (const item of o.descuentos) {
      if (!item || typeof item !== "object") continue;
      const r = item as Record<string, unknown>;
      const title = str(r.title);
      if (!title) continue;
      descuentos.push({
        id: str(r.id) || `d-${descuentos.length + 1}`,
        title,
        subtitle: str(r.subtitle),
        badge: str(r.badge),
        imageUrl: str(r.imageUrl),
        href: str(r.href),
        audience: audienceOf(r.audience),
      });
    }
  }

  const planes: PlanItem[] = [];
  if (Array.isArray(o.planes)) {
    for (const item of o.planes) {
      if (!item || typeof item !== "object") continue;
      const r = item as Record<string, unknown>;
      const name = str(r.name);
      const priceLabel = str(r.priceLabel);
      if (!name || !priceLabel) continue;
      const features = Array.isArray(r.features)
        ? r.features.filter((f): f is string => typeof f === "string" && !!f.trim())
        : [];
      planes.push({
        id: str(r.id) || `p-${planes.length + 1}`,
        name,
        priceLabel,
        description: str(r.description),
        features,
        ctaLabel: str(r.ctaLabel),
        ctaHref: str(r.ctaHref),
        highlighted: r.highlighted === true,
        audience: audienceOf(r.audience),
      });
    }
  }

  const kits: KitItem[] = [];
  if (Array.isArray(o.kits)) {
    for (const item of o.kits) {
      if (!item || typeof item !== "object") continue;
      const r = item as Record<string, unknown>;
      const title = str(r.title);
      if (!title) continue;
      kits.push({
        id: str(r.id) || `k-${kits.length + 1}`,
        title,
        description: str(r.description),
        imageUrl: str(r.imageUrl),
        priceLabel: str(r.priceLabel),
        href: str(r.href),
        audience: audienceOf(r.audience),
      });
    }
  }

  const redes: SocialEmbed[] = [];
  if (Array.isArray(o.redes)) {
    for (const item of o.redes) {
      if (!item || typeof item !== "object") continue;
      const r = item as Record<string, unknown>;
      const url = str(r.url);
      const platform = r.platform === "instagram" ? "instagram" : "youtube";
      if (!url) continue;
      redes.push({
        id: str(r.id) || `s-${redes.length + 1}`,
        platform,
        title: str(r.title),
        url,
        thumbnailUrl: str(r.thumbnailUrl),
      });
    }
  }

  const certificaciones: CertificationItem[] = [];
  if (Array.isArray(o.certificaciones)) {
    for (const item of o.certificaciones) {
      if (!item || typeof item !== "object") continue;
      const r = item as Record<string, unknown>;
      const name = str(r.name);
      if (!name) continue;
      certificaciones.push({
        id: str(r.id) || `c-${certificaciones.length + 1}`,
        name,
        description: str(r.description),
        logoUrl: str(r.logoUrl),
      });
    }
  }

  const parseAudience = (v: unknown): AudienceCopy | undefined => {
    if (!v || typeof v !== "object") return undefined;
    const a = v as Record<string, unknown>;
    return {
      headline: str(a.headline),
      body: str(a.body),
      ctaLabel: str(a.ctaLabel),
      ctaHref: str(a.ctaHref),
    };
  };

  return {
    regions,
    descuentos,
    planes,
    kits,
    redes,
    certificaciones,
    hogar: parseAudience(o.hogar),
    empresa: parseAudience(o.empresa),
  };
}

/** Demo MiBidón content — Spanish, Chile-oriented */
export function defaultDemoModulesContent(): ModulesContent {
  return {
    regions: [
      { id: "rm", name: "Santiago", zone: "Región Metropolitana" },
      { id: "valpo", name: "Viña del Mar / Valparaíso", zone: "Valparaíso" },
      { id: "maule", name: "Talca / Curicó", zone: "Maule" },
      { id: "biobio", name: "Concepción", zone: "Biobío" },
      { id: "araucania", name: "Temuco", zone: "La Araucanía" },
    ],
    descuentos: [
      {
        id: "d1",
        title: "Pack familiar 4 bidones",
        subtitle: "Ahorrá en tu primera compra del mes",
        badge: "-15%",
        imageUrl: "/brand/rio-claro/destacado-02.jpg",
        href: "/productos",
        audience: "hogar",
      },
      {
        id: "d2",
        title: "Oficina 8 bidones",
        subtitle: "Descuento por volumen semanal",
        badge: "-20%",
        imageUrl: "/brand/rio-claro/destacado-03.jpg",
        href: "/productos",
        audience: "empresa",
      },
      {
        id: "d3",
        title: "Dispensador + 2 bidones",
        subtitle: "Kit de bienvenida con envío incluido en zonas seleccionadas",
        badge: "Combo",
        imageUrl: "/brand/rio-claro/destacado-01.jpg",
        href: "/productos",
        audience: "ambos",
      },
    ],
    planes: [
      {
        id: "p1",
        name: "Plan Hogar",
        priceLabel: "desde $8.990 / mes",
        description: "Hidratación constante sin preocuparte de pedir.",
        features: [
          "2 bidones 20 L al mes",
          "Ruta fija a domicilio",
          "Pago con WebPay",
        ],
        ctaLabel: "Quiero este plan",
        ctaHref: "/productos",
        audience: "hogar",
      },
      {
        id: "p2",
        name: "Plan Oficina",
        priceLabel: "desde $29.990 / mes",
        description: "Para equipos que no pueden quedarse sin agua.",
        features: [
          "8–12 bidones semanales",
          "Contacto garantizado",
          "Factura empresa",
        ],
        ctaLabel: "Cotizar oficina",
        ctaHref: "/#contacto",
        highlighted: true,
        audience: "empresa",
      },
      {
        id: "p3",
        name: "Plan Flexible",
        priceLabel: "según consumo",
        description: "Pedís cuando necesitás, con precio preferente.",
        features: ["Sin permanencia", "Catálogo completo", "Soporte WhatsApp"],
        ctaLabel: "Ver productos",
        ctaHref: "/productos",
        audience: "ambos",
      },
    ],
    kits: [
      {
        id: "k1",
        title: "Kit inicio hogar",
        description: "Dispensador de mesa + 2 bidones 20 L listos para usar.",
        imageUrl: "/brand/rio-claro/destacado-04.jpg",
        priceLabel: "$34.990",
        href: "/productos",
        audience: "hogar",
      },
      {
        id: "k2",
        title: "Kit oficina esencial",
        description: "Dispensador de pie + 4 bidones para arrancar la semana.",
        imageUrl: "/brand/rio-claro/destacado-03.jpg",
        priceLabel: "$89.990",
        href: "/productos",
        audience: "empresa",
      },
      {
        id: "k3",
        title: "Clientes que ya trabajan con nosotros",
        description:
          "Paquetes pensados para quienes ya tienen dispensador y solo reponen bidones.",
        imageUrl: "/brand/rio-claro/destacado-02.jpg",
        priceLabel: "Ver packs",
        href: "/productos",
        audience: "ambos",
      },
    ],
    redes: [
      {
        id: "yt1",
        platform: "youtube",
        title: "Cómo cuidamos el agua",
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        thumbnailUrl: "/brand/rio-claro/destacado-01.jpg",
      },
      {
        id: "ig1",
        platform: "instagram",
        title: "Detrás de la ruta",
        url: "https://www.instagram.com/",
        thumbnailUrl: "/brand/rio-claro/destacado-02.jpg",
      },
    ],
    certificaciones: [
      {
        id: "c1",
        name: "Proceso multietapas",
        description: "Purificación en 5 etapas, agua libre de sodio.",
        logoUrl: "/brand/rio-claro/logo.png",
      },
      {
        id: "c2",
        name: "Contacto garantizado",
        description: "Compromiso de entrega semanal en rutas activas.",
      },
      {
        id: "c3",
        name: "Pago seguro WebPay",
        description: "Transacciones con Transbank en ambiente controlado.",
      },
    ],
    hogar: {
      headline: "Agua pura para tu hogar",
      body: "Bidones, dispensadores y planes pensados para familias. Pedí online y recibí en tu comuna.",
      ctaLabel: "Ver ofertas hogar",
      ctaHref: "/#descuentos",
    },
    empresa: {
      headline: "Soluciones de agua para tu empresa",
      body: "Planes para oficinas, facturación y rutas fijas. Mantén a tu equipo hidratado sin fricción.",
      ctaLabel: "Cotizar empresa",
      ctaHref: "/#planes",
    },
  };
}

export function forAudience<T extends { audience?: Audience | "ambos" }>(
  items: T[],
  audience: Audience,
): T[] {
  return items.filter(
    (i) => !i.audience || i.audience === "ambos" || i.audience === audience,
  );
}
