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

export type BenefitItem = {
  id: string;
  title: string;
  body?: string;
  imageUrl?: string;
};

export const MAX_BENEFITS = 8;

/** What «¿Por qué elegirnos?» shows while a store hasn't written its own benefits. */
export const GENERIC_BENEFITS: readonly BenefitItem[] = [
  { id: "b1", title: "Agua purificada", body: "Bidones y botellones listos para tu hogar u oficina." },
  { id: "b2", title: "Despacho a domicilio", body: "Coordinamos la entrega en tu comuna, sin que tengas que salir." },
  { id: "b3", title: "Pide en línea", body: "Arma tu pedido en minutos desde el celular o el computador." },
  { id: "b4", title: "Atención directa", body: "Resolvemos tus dudas por teléfono o WhatsApp." },
];

export type AudienceCopy = {
  headline?: string;
  body?: string;
  ctaLabel?: string;
  ctaHref?: string;
};

export type ModulesContent = {
  regions: RegionOption[];
  planes: PlanItem[];
  kits: KitItem[];
  redes: SocialEmbed[];
  certificaciones: CertificationItem[];
  beneficios: BenefitItem[];
  beneficiosTitle?: string;
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
    planes: [],
    kits: [],
    redes: [],
    certificaciones: [],
    beneficios: [],
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

  const beneficios: BenefitItem[] = [];
  if (Array.isArray(o.beneficios)) {
    for (const item of o.beneficios) {
      if (!item || typeof item !== "object" || beneficios.length >= MAX_BENEFITS) continue;
      const r = item as Record<string, unknown>;
      const title = str(r.title);
      if (!title) continue;
      beneficios.push({
        id: str(r.id) || `b-${beneficios.length + 1}`,
        title,
        body: str(r.body),
        imageUrl: str(r.imageUrl),
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
    planes,
    kits,
    redes,
    certificaciones,
    beneficios,
    beneficiosTitle: str(o.beneficiosTitle),
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
        description: "Pides cuando lo necesitas, con precio preferente.",
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
        priceLabel: "$34.990",
        href: "/productos",
        audience: "hogar",
      },
      {
        id: "k2",
        title: "Kit oficina esencial",
        description: "Dispensador de pie + 4 bidones para arrancar la semana.",
        priceLabel: "$89.990",
        href: "/productos",
        audience: "empresa",
      },
      {
        id: "k3",
        title: "Clientes que ya trabajan con nosotros",
        description:
          "Paquetes pensados para quienes ya tienen dispensador y solo reponen bidones.",
        priceLabel: "Ver packs",
        href: "/productos",
        audience: "ambos",
      },
    ],
    redes: [],
    certificaciones: [
      {
        id: "c1",
        name: "Proceso multietapas",
        description: "Purificación en 5 etapas, agua libre de sodio.",
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
    beneficiosTitle: "¿Por qué elegirnos?",
    beneficios: GENERIC_BENEFITS.map((b) => ({ ...b })),
    hogar: {
      headline: "Agua pura para tu hogar",
      body: "Bidones, dispensadores y planes pensados para familias. Pide online y recibe en tu comuna.",
      ctaLabel: "Ver productos",
      ctaHref: "/#productos",
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
