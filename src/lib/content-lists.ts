import type { ModuleFlags, ModulesContent } from "@/lib/modules";

export type ListKind = "planes" | "kits" | "certificaciones" | "redes";

export type FieldSpec = {
  name: string;
  label: string;
  type: "text" | "textarea" | "lines" | "checkbox" | "audience";
  required?: boolean;
  max: number;
  placeholder?: string;
  hint?: string;
};

export type ListSpec = {
  kind: ListKind;
  title: string;
  description: string;
  singular: string;
  /** Article + noun for messages, e.g. "el plan". */
  the: string;
  max: number;
  idPrefix: string;
  titleField: string;
  flag: keyof ModuleFlags;
  anchor: string;
  image?: { field: "imageUrl" | "logoUrl" | "thumbnailUrl"; label: string; hint: string };
  fields: FieldSpec[];
};

const AUDIENCE: FieldSpec = {
  name: "audience",
  label: "¿A quién se muestra?",
  type: "audience",
  max: 10,
  hint: "La tienda tiene el selector Hogar / Empresa arriba.",
};

export const LIST_SPECS: Record<ListKind, ListSpec> = {
  planes: {
    kind: "planes",
    title: "Planes",
    description: "Suscripciones o planes mensuales que ofreces. Se muestran como tarjetas con precio y lo que incluyen.",
    singular: "plan",
    the: "el plan",
    max: 6,
    idPrefix: "p",
    titleField: "name",
    flag: "planes",
    anchor: "planes",
    fields: [
      { name: "name", label: "Nombre del plan", type: "text", required: true, max: 60, placeholder: "Ej: Plan Hogar" },
      { name: "priceLabel", label: "Precio", type: "text", required: true, max: 40, placeholder: "Ej: desde $8.990 / mes" },
      { name: "description", label: "Descripción corta (opcional)", type: "textarea", max: 200, placeholder: "Una frase que explique para quién es." },
      {
        name: "features",
        label: "Qué incluye (uno por línea)",
        type: "lines",
        max: 600,
        placeholder: "2 bidones 20 L al mes\nDespacho a domicilio\nPago con WebPay",
      },
      { name: "ctaLabel", label: "Texto del botón (opcional)", type: "text", max: 40, placeholder: "Ej: Quiero este plan" },
      { name: "ctaHref", label: "El botón lleva a (opcional)", type: "text", max: 200, placeholder: "/productos", hint: "Usa /productos, /#contacto o un link completo." },
      { name: "highlighted", label: "Destacar este plan (borde de color)", type: "checkbox", max: 2 },
      AUDIENCE,
    ],
  },
  kits: {
    kind: "kits",
    title: "Kits",
    description: "Paquetes o combos (por ejemplo dispensador + bidones). Se muestran como tarjetas con foto y precio.",
    singular: "kit",
    the: "el kit",
    max: 9,
    idPrefix: "k",
    titleField: "title",
    flag: "kits",
    anchor: "kits",
    image: { field: "imageUrl", label: "Foto (opcional)", hint: "Ideal horizontal, 1200 × 750 px." },
    fields: [
      { name: "title", label: "Nombre del kit", type: "text", required: true, max: 60, placeholder: "Ej: Kit inicio hogar" },
      { name: "description", label: "Qué trae (opcional)", type: "textarea", max: 200, placeholder: "Ej: Dispensador de mesa + 2 bidones 20 L." },
      { name: "priceLabel", label: "Precio (opcional)", type: "text", max: 40, placeholder: "Ej: $34.990" },
      { name: "href", label: "El botón «Ver» lleva a (opcional)", type: "text", max: 200, placeholder: "/productos", hint: "Usa /productos, el link de un producto o déjalo vacío." },
      AUDIENCE,
    ],
  },
  certificaciones: {
    kind: "certificaciones",
    title: "Certificaciones",
    description: "Sellos, permisos o garantías que dan confianza (resolución sanitaria, análisis de laboratorio, etc.).",
    singular: "certificación",
    the: "la certificación",
    max: 6,
    idPrefix: "c",
    titleField: "name",
    flag: "certificaciones",
    anchor: "certificaciones",
    image: { field: "logoUrl", label: "Logo o sello (opcional)", hint: "PNG con fondo transparente, ideal 400 × 400 px." },
    fields: [
      { name: "name", label: "Nombre", type: "text", required: true, max: 60, placeholder: "Ej: Resolución sanitaria SEREMI" },
      { name: "description", label: "Detalle (opcional)", type: "textarea", max: 200, placeholder: "Ej: Planta autorizada, análisis mensual de laboratorio." },
    ],
  },
  redes: {
    kind: "redes",
    title: "Videos y publicaciones",
    description: "Videos de YouTube o publicaciones de Instagram que quieras mostrar en la sección «Redes».",
    singular: "video",
    the: "el video",
    max: 6,
    idPrefix: "s",
    titleField: "title",
    flag: "redes",
    anchor: "redes",
    image: {
      field: "thumbnailUrl",
      label: "Imagen de portada (solo Instagram)",
      hint: "Los videos de YouTube se reproducen directo; Instagram muestra esta imagen con un link.",
    },
    fields: [
      {
        name: "url",
        label: "Link del video o publicación",
        type: "text",
        required: true,
        max: 300,
        placeholder: "https://www.youtube.com/watch?v=…",
        hint: "Copia el link desde YouTube (Compartir → Copiar) o desde Instagram.",
      },
      { name: "title", label: "Título (opcional)", type: "text", max: 80, placeholder: "Ej: Cómo purificamos el agua" },
    ],
  },
};

export function isListKind(v: string): v is ListKind {
  return v in LIST_SPECS;
}

export type ListItem = Record<string, unknown> & { id: string };

export function listItems(content: ModulesContent, kind: ListKind): ListItem[] {
  return content[kind] as unknown as ListItem[];
}

export function itemTitle(spec: ListSpec, item: ListItem): string {
  const v = item[spec.titleField];
  if (typeof v === "string" && v) return v;
  return typeof item.url === "string" ? item.url : spec.singular;
}

export function platformOf(url: string): "youtube" | "instagram" {
  return /instagram\.com/i.test(url) ? "instagram" : "youtube";
}
