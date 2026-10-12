import type { LandingSectionKey } from "@/lib/landing/schema";

export type Field =
  | { type: "text" | "textarea" | "url"; key: string; label: string; max: number; hint?: string }
  | { type: "number"; key: string; label: string; min: number; max: number; hint?: string }
  | { type: "bool"; key: string; label: string; hint?: string }
  | { type: "icon"; key: string; label: string; nullable?: boolean }
  | { type: "group"; key: string; label: string; fields: Field[] }
  | {
      type: "list";
      key: string;
      label: string;
      itemLabel: string;
      titleKey: string;
      max: number;
      fields: Field[];
      newItem: Record<string, unknown>;
    };

export type SectionMeta = {
  key: LandingSectionKey;
  slug: string;
  title: string;
  description: string;
  primary: boolean;
  fields: Field[];
};

const FORMAT_HINT = "Usa **negrita** y _cursiva_.";
const TRIAL_HINT = "Tokens: {dias} = número de días, {prueba} = días + etiqueta (ej. “14 días gratis”).";

const navLabel: Field = {
  type: "text",
  key: "navLabel",
  label: "Texto en el menú",
  max: 40,
  hint: "Vacío = no aparece en el menú superior.",
};
const intro: Field[] = [
  { type: "text", key: "eyebrow", label: "Antetítulo", max: 80 },
  { type: "text", key: "title", label: "Título", max: 160 },
  { type: "textarea", key: "body", label: "Bajada", max: 400 },
];

const column = (label: string): Field[] => [
  { type: "text", key: "title", label: `Título columna ${label}`, max: 100 },
  { type: "text", key: "subtitle", label: "Subtítulo", max: 120 },
  {
    type: "list",
    key: "items",
    label: "Viñetas",
    itemLabel: "Viñeta",
    titleKey: "title",
    max: 10,
    fields: [
      { type: "text", key: "title", label: "Título (negrita)", max: 120 },
      { type: "textarea", key: "body", label: "Detalle", max: 400 },
    ],
    newItem: { title: "Nueva viñeta:", body: "" },
  },
  {
    type: "list",
    key: "bars",
    label: "Barras de resultado",
    itemLabel: "Barra",
    titleKey: "label",
    max: 5,
    fields: [
      { type: "text", key: "label", label: "Etiqueta", max: 80 },
      { type: "number", key: "percent", label: "Porcentaje", min: 0, max: 100 },
    ],
    newItem: { label: "Nuevo indicador", percent: 50 },
  },
  { type: "text", key: "result", label: "Texto de resultado", max: 160 },
];

const SECTIONS: SectionMeta[] = [
  {
    key: "demo",
    slug: "demo",
    title: "Demo en vivo",
    description:
      "Botón “Ver demo” del menú y tarjeta con enlaces a la tienda y al panel admin de demostración.",
    primary: true,
    fields: [
      { type: "text", key: "navLabel", label: "Botón en el menú", max: 40, hint: "Vacío = no aparece en el menú." },
      { type: "text", key: "badge", label: "Etiqueta", max: 40 },
      { type: "text", key: "title", label: "Título", max: 160 },
      { type: "textarea", key: "body", label: "Texto", max: 300 },
      { type: "text", key: "storeLabel", label: "Botón tienda demo", max: 60 },
      { type: "url", key: "storeHref", label: "URL tienda demo", max: 500 },
      { type: "text", key: "adminLabel", label: "Botón panel admin demo", max: 60, hint: "Vacío = oculto." },
      { type: "url", key: "adminHref", label: "URL panel admin demo", max: 500 },
      { type: "url", key: "imageUrl", label: "URL de la imagen", max: 500, hint: "Vacío = sin imagen." },
      { type: "text", key: "imageAlt", label: "Texto alternativo", max: 200 },
    ],
  },
  {
    key: "steps",
    slug: "como-funciona",
    title: "Cómo funciona",
    description: "Pasos numerados (máximo 4).",
    primary: true,
    fields: [
      navLabel,
      ...intro,
      {
        type: "list",
        key: "items",
        label: "Pasos",
        itemLabel: "Paso",
        titleKey: "title",
        max: 4,
        fields: [
          { type: "text", key: "title", label: "Título", max: 80 },
          { type: "textarea", key: "body", label: "Descripción", max: 200 },
        ],
        newItem: { title: "Nuevo paso", body: "" },
      },
    ],
  },
  {
    key: "trial",
    slug: "dias-gratis",
    title: "Días gratis",
    description:
      "Prueba gratuita que aparece en la barra de anuncio, botones de inicio, CTA móvil y nota de precios.",
    primary: false,
    fields: [
      { type: "number", key: "days", label: "Días de prueba", min: 1, max: 365 },
      { type: "text", key: "label", label: "Etiqueta", max: 40, hint: "Se usa en {prueba}: “14 días gratis”." },
      { type: "text", key: "ctaLabel", label: "Botón principal (hero y móvil)", max: 60, hint: TRIAL_HINT },
      { type: "text", key: "headerCtaLabel", label: "Botón del menú", max: 40 },
      { type: "text", key: "pricingNote", label: "Nota bajo el precio", max: 160, hint: TRIAL_HINT },
      { type: "textarea", key: "whatsappMessage", label: "Mensaje de WhatsApp", max: 300, hint: TRIAL_HINT },
      {
        type: "text",
        key: "noTrialCtaLabel",
        label: "Botón cuando la prueba está desactivada",
        max: 60,
      },
    ],
  },
  {
    key: "comparison",
    slug: "comparativa",
    title: "Sistema MiBidón (comparativa)",
    description: "WhatsApp manual vs MiBidón: columnas, viñetas y barras de resultado.",
    primary: false,
    fields: [
      navLabel,
      ...intro,
      { type: "text", key: "badge", label: "Etiqueta columna MiBidón", max: 40 },
      { type: "group", key: "manual", label: "Columna: WhatsApp manual", fields: column("manual") },
      { type: "group", key: "mibidon", label: "Columna: MiBidón", fields: column("MiBidón") },
    ],
  },
  {
    key: "features",
    slug: "funcionalidades",
    title: "Funcionalidades",
    description: "Tarjetas de funcionalidades con ícono opcional.",
    primary: true,
    fields: [
      navLabel,
      ...intro,
      {
        type: "list",
        key: "items",
        label: "Funcionalidades",
        itemLabel: "Funcionalidad",
        titleKey: "title",
        max: 12,
        fields: [
          { type: "icon", key: "icon", label: "Ícono", nullable: true },
          { type: "text", key: "title", label: "Título", max: 80 },
          { type: "textarea", key: "body", label: "Descripción", max: 300 },
        ],
        newItem: { icon: "Sparkles", title: "Nueva funcionalidad", body: "Descripción breve." },
      },
    ],
  },
  {
    key: "testimonials",
    slug: "testimonios",
    title: "Testimonios",
    description: "Casos de éxito con nombre, cargo/planta, cita y foto opcional.",
    primary: false,
    fields: [
      navLabel,
      ...intro,
      {
        type: "list",
        key: "items",
        label: "Testimonios",
        itemLabel: "Testimonio",
        titleKey: "name",
        max: 12,
        fields: [
          { type: "text", key: "name", label: "Nombre", max: 80 },
          { type: "text", key: "role", label: "Cargo / planta", max: 120 },
          { type: "textarea", key: "quote", label: "Cita", max: 600, hint: FORMAT_HINT },
          {
            type: "url",
            key: "avatarUrl",
            label: "URL de la foto (opcional)",
            max: 500,
            hint: "https://… o ruta relativa (/brand/…). Vacío = iniciales.",
          },
        ],
        newItem: { name: "Nombre Apellido", role: "", quote: "Cita del cliente.", avatarUrl: "" },
      },
    ],
  },
  {
    key: "pricing",
    slug: "planes",
    title: "Planes",
    description: "Planes de precios. Solo se muestran los planes activos, en el orden de la lista.",
    primary: true,
    fields: [
      navLabel,
      ...intro,
      { type: "text", key: "footnote", label: "Nota al pie de cada plan", max: 160 },
      {
        type: "list",
        key: "plans",
        label: "Planes",
        itemLabel: "Plan",
        titleKey: "name",
        max: 6,
        fields: [
          { type: "bool", key: "active", label: "Plan activo (visible)" },
          { type: "bool", key: "highlighted", label: "Destacado", hint: "Borde cian y etiqueta destacada." },
          { type: "text", key: "name", label: "Nombre del plan", max: 60 },
          { type: "text", key: "badge", label: "Etiqueta destacada", max: 40, hint: "Ej. “Más elegido”." },
          { type: "text", key: "headline", label: "Titular", max: 100 },
          { type: "text", key: "description", label: "Descripción", max: 200 },
          { type: "number", key: "price", label: "Precio (CLP)", min: 0, max: 100_000_000 },
          { type: "text", key: "period", label: "Periodo", max: 30, hint: "Ej. “CLP / mes”." },
          {
            type: "list",
            key: "features",
            label: "Características",
            itemLabel: "Característica",
            titleKey: "text",
            max: 15,
            fields: [{ type: "text", key: "text", label: "Texto", max: 160 }],
            newItem: { text: "Nueva característica" },
          },
          { type: "text", key: "ctaLabel", label: "Texto del botón", max: 60 },
          {
            type: "url",
            key: "ctaUrl",
            label: "URL del botón",
            max: 500,
            hint: "Vacío = WhatsApp de ventas con el nombre y precio del plan.",
          },
        ],
        newItem: {
          active: true,
          highlighted: false,
          name: "Nuevo plan",
          badge: "",
          headline: "",
          description: "",
          price: 0,
          period: "CLP / mes",
          features: [],
          ctaLabel: "Quiero este plan",
          ctaUrl: "",
        },
      },
    ],
  },
  {
    key: "faq",
    slug: "faq",
    title: "Preguntas frecuentes",
    description: "Preguntas y respuestas en el orden de la lista.",
    primary: true,
    fields: [
      ...intro,
      {
        type: "list",
        key: "items",
        label: "Preguntas",
        itemLabel: "Pregunta",
        titleKey: "q",
        max: 20,
        fields: [
          { type: "text", key: "q", label: "Pregunta", max: 200 },
          { type: "textarea", key: "a", label: "Respuesta", max: 1200 },
        ],
        newItem: { q: "¿Nueva pregunta?", a: "Respuesta." },
      },
    ],
  },
  {
    key: "announcement",
    slug: "anuncio",
    title: "Barra de anuncio",
    description: "Franja superior sobre el menú.",
    primary: false,
    fields: [
      { type: "text", key: "badge", label: "Etiqueta", max: 30 },
      { type: "text", key: "text", label: "Texto (con prueba activa)", max: 200, hint: TRIAL_HINT },
      { type: "text", key: "textNoTrial", label: "Texto (prueba desactivada)", max: 200 },
      { type: "text", key: "linkLabel", label: "Texto del enlace", max: 60 },
      { type: "url", key: "linkHref", label: "URL del enlace", max: 500, hint: "Ej. #precios. Se oculta si apunta a una sección desactivada." },
    ],
  },
  {
    key: "hero",
    slug: "hero",
    title: "Hero",
    description: "Titular principal, botones (planes y demo) y simulador opcional.",
    primary: true,
    fields: [
      { type: "text", key: "badge", label: "Etiqueta superior", max: 80 },
      { type: "text", key: "headline", label: "Titular", max: 120 },
      { type: "text", key: "headlineAccent", label: "Titular destacado (cian)", max: 60 },
      { type: "textarea", key: "body", label: "Bajada", max: 500, hint: FORMAT_HINT },
      { type: "text", key: "secondaryCtaLabel", label: "Botón demo", max: 60 },
      { type: "url", key: "secondaryCtaHref", label: "URL botón demo", max: 500 },
      {
        type: "text",
        key: "whatsappLabel",
        label: "Enlace a WhatsApp bajo los botones",
        max: 60,
        hint: "Vacío = oculto.",
      },
      {
        type: "list",
        key: "chips",
        label: "Sellos bajo los botones",
        itemLabel: "Sello",
        titleKey: "label",
        max: 4,
        fields: [{ type: "text", key: "label", label: "Texto", max: 60 }],
        newItem: { label: "Nuevo sello" },
      },
      { type: "text", key: "liveText", label: "Texto “En vivo”", max: 160, hint: FORMAT_HINT },
      {
        type: "bool",
        key: "showSimulator",
        label: "Mostrar simulador de ingresos",
        hint: "Si está activo, la tarjeta de demo pasa a una franja bajo el hero.",
      },
      { type: "text", key: "simulatorNavLabel", label: "Texto del simulador en el menú", max: 40 },
    ],
  },
  {
    key: "trust",
    slug: "confianza",
    title: "Beneficios",
    description: "Franja de 3–4 beneficios cortos bajo el hero.",
    primary: true,
    fields: [
      { type: "text", key: "eyebrow", label: "Antetítulo", max: 60 },
      { type: "text", key: "text", label: "Texto", max: 200 },
      {
        type: "list",
        key: "badges",
        label: "Sellos",
        itemLabel: "Sello",
        titleKey: "label",
        max: 6,
        fields: [
          { type: "icon", key: "icon", label: "Ícono" },
          { type: "text", key: "label", label: "Texto", max: 50 },
        ],
        newItem: { icon: "ShieldCheck", label: "Nuevo sello" },
      },
    ],
  },
  {
    key: "stats",
    slug: "estadisticas",
    title: "Estadísticas",
    description: "Métricas animadas.",
    primary: false,
    fields: [
      { type: "text", key: "title", label: "Título", max: 160 },
      { type: "textarea", key: "body", label: "Bajada", max: 300 },
      {
        type: "list",
        key: "items",
        label: "Métricas",
        itemLabel: "Métrica",
        titleKey: "label",
        max: 6,
        fields: [
          { type: "icon", key: "icon", label: "Ícono" },
          { type: "text", key: "label", label: "Etiqueta", max: 60 },
          { type: "number", key: "value", label: "Valor", min: 0, max: 100_000_000 },
          { type: "text", key: "prefix", label: "Prefijo", max: 5 },
          { type: "text", key: "suffix", label: "Sufijo", max: 5 },
          { type: "text", key: "trend", label: "Tendencia", max: 60 },
        ],
        newItem: { icon: "TrendingUp", label: "Nueva métrica", value: 0, prefix: "", suffix: "", trend: "" },
      },
    ],
  },
  {
    key: "showcase",
    slug: "panel-despachos",
    title: "Panel de despachos",
    description: "Bloque destacado con imagen bajo las funcionalidades.",
    primary: false,
    fields: [
      { type: "text", key: "eyebrow", label: "Antetítulo", max: 60 },
      { type: "text", key: "title", label: "Título", max: 160 },
      { type: "textarea", key: "body", label: "Texto", max: 500 },
      { type: "text", key: "linkLabel", label: "Texto del enlace", max: 60 },
      { type: "url", key: "imageUrl", label: "URL de la imagen", max: 500 },
      { type: "text", key: "imageAlt", label: "Texto alternativo", max: 200 },
    ],
  },
  {
    key: "advisor",
    slug: "asesor",
    title: "Llamado final",
    description: "Franja de cierre con botones a planes, demo y WhatsApp.",
    primary: true,
    fields: [
      { type: "text", key: "title", label: "Título", max: 160 },
      { type: "textarea", key: "body", label: "Texto", max: 300 },
      { type: "text", key: "ctaLabel", label: "Botón", max: 60 },
      { type: "textarea", key: "whatsappMessage", label: "Mensaje de WhatsApp", max: 300 },
    ],
  },
  {
    key: "footer",
    slug: "footer",
    title: "Footer",
    description: "Pie de página.",
    primary: true,
    fields: [
      { type: "text", key: "brandText", label: "Texto de marca", max: 80 },
      { type: "text", key: "demoLabel", label: "Enlace tienda demo", max: 40, hint: "Vacío = oculto." },
      { type: "text", key: "loginLabel", label: "Enlace acceso clientes", max: 40, hint: "Vacío = oculto." },
      { type: "text", key: "contactEmail", label: "Correo de contacto", max: 120 },
    ],
  },
];

const ORDER: LandingSectionKey[] = [
  "hero",
  "demo",
  "trust",
  "steps",
  "features",
  "pricing",
  "faq",
  "advisor",
  "footer",
  "trial",
  "announcement",
  "stats",
  "comparison",
  "showcase",
  "testimonials",
];

export const SECTION_META: SectionMeta[] = ORDER.map((k) => SECTIONS.find((s) => s.key === k)!);

export function sectionBySlug(slug: string): SectionMeta | undefined {
  return SECTION_META.find((s) => s.slug === slug);
}
