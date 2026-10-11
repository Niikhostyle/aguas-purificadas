import { z } from "zod";
import { LANDING_ICON_NAMES } from "@/lib/landing/icon-names";

/**
 * Accepts http(s), mailto:, wa.me (scheme optional), in-page anchors and
 * same-origin relative paths. Everything else (javascript:, data:, //host) is rejected.
 */
export function sanitizeLandingUrl(raw: string): string | null {
  const v = raw.trim();
  if (!v) return "";
  if (/[\s<>"'`\\]/.test(v)) return null;
  if (v.startsWith("#")) return /^#[A-Za-z0-9_-]*$/.test(v) ? v : null;
  if (v.startsWith("/")) return v.startsWith("//") ? null : v;
  if (/^wa\.me\//i.test(v)) return `https://${v}`;
  if (/^mailto:[^@\s]+@[^@\s]+$/i.test(v)) return v;
  try {
    const u = new URL(v);
    if (u.protocol !== "https:" && u.protocol !== "http:") return null;
    return u.toString();
  } catch {
    return null;
  }
}

const text = (max: number) => z.string().trim().max(max, `Máximo ${max} caracteres`);
const reqText = (max: number) => text(max).min(1, "Obligatorio");

const url = z
  .string()
  .max(500, "URL demasiado larga")
  .transform((v, ctx) => {
    const clean = sanitizeLandingUrl(v);
    if (clean === null) {
      ctx.addIssue({
        code: "custom",
        message: "URL no permitida (usa https://, wa.me, mailto: o una ruta relativa)",
      });
      return z.NEVER;
    }
    return clean;
  });

const id = z.string().trim().min(1).max(40).regex(/^[A-Za-z0-9_-]+$/);
const icon = z.enum(LANDING_ICON_NAMES);
const percent = z.coerce.number().int().min(0).max(100);

const bullet = z.object({ id, title: reqText(120), body: text(400) });
const bar = z.object({ id, label: reqText(80), percent });

const column = z.object({
  title: reqText(100),
  subtitle: text(120),
  items: z.array(bullet).max(10),
  result: text(160),
  bars: z.array(bar).max(5),
});

const intro = {
  eyebrow: text(80),
  title: reqText(160),
  body: text(400),
};

export const landingSchemas = {
  trial: z.object({
    days: z.coerce.number().int().min(1).max(365),
    label: reqText(40),
    ctaLabel: reqText(60),
    headerCtaLabel: reqText(40),
    pricingNote: text(160),
    whatsappMessage: reqText(300),
    noTrialCtaLabel: reqText(60),
  }),
  announcement: z.object({
    badge: text(30),
    text: reqText(200),
    textNoTrial: reqText(200),
    linkLabel: text(60),
    linkHref: url,
  }),
  hero: z.object({
    badge: text(80),
    headline: reqText(120),
    headlineAccent: text(60),
    body: reqText(500),
    secondaryCtaLabel: text(60),
    secondaryCtaHref: url,
    chips: z.array(z.object({ id, label: reqText(60) })).max(4),
    liveText: text(160),
    showSimulator: z.boolean(),
    simulatorNavLabel: text(40),
  }),
  trust: z.object({
    eyebrow: text(60),
    text: reqText(200),
    badges: z.array(z.object({ id, icon, label: reqText(50) })).max(6),
  }),
  stats: z.object({
    title: reqText(160),
    body: text(300),
    items: z
      .array(
        z.object({
          id,
          icon,
          label: reqText(60),
          value: z.coerce.number().int().min(0).max(100_000_000),
          prefix: text(5),
          suffix: text(5),
          trend: text(60),
        }),
      )
      .max(6),
  }),
  comparison: z.object({
    navLabel: text(40),
    ...intro,
    badge: text(40),
    manual: column,
    mibidon: column,
  }),
  features: z.object({
    navLabel: text(40),
    ...intro,
    items: z
      .array(z.object({ id, icon: icon.nullable(), title: reqText(80), body: reqText(300) }))
      .max(12),
  }),
  showcase: z.object({
    eyebrow: text(60),
    title: reqText(160),
    body: text(500),
    linkLabel: text(60),
    imageUrl: url,
    imageAlt: text(200),
  }),
  testimonials: z.object({
    navLabel: text(40),
    ...intro,
    items: z
      .array(
        z.object({
          id,
          name: reqText(80),
          role: text(120),
          quote: reqText(600),
          avatarUrl: url,
        }),
      )
      .max(12),
  }),
  pricing: z.object({
    navLabel: text(40),
    ...intro,
    footnote: text(160),
    plans: z
      .array(
        z.object({
          id,
          active: z.boolean(),
          highlighted: z.boolean(),
          name: reqText(60),
          badge: text(40),
          headline: text(100),
          description: text(200),
          price: z.coerce.number().int().min(0).max(100_000_000),
          period: text(30),
          features: z.array(z.object({ id, text: reqText(160) })).max(15),
          ctaLabel: reqText(60),
          ctaUrl: url,
        }),
      )
      .max(6),
  }),
  faq: z.object({
    ...intro,
    items: z.array(z.object({ id, q: reqText(200), a: reqText(1200) })).max(20),
  }),
  advisor: z.object({
    title: reqText(160),
    body: text(300),
    ctaLabel: reqText(60),
    whatsappMessage: reqText(300),
  }),
  footer: z.object({
    brandText: reqText(80),
    demoLabel: text(40),
    loginLabel: text(40),
    contactEmail: z.union([z.literal(""), z.email("Correo inválido").max(120)]),
  }),
} as const;

export type LandingSectionKey = keyof typeof landingSchemas;

export const LANDING_SECTION_KEYS = Object.keys(landingSchemas) as LandingSectionKey[];

export type LandingSectionContent<K extends LandingSectionKey> = z.output<
  (typeof landingSchemas)[K]
>;

export type LandingSection<K extends LandingSectionKey> = {
  enabled: boolean;
  content: LandingSectionContent<K>;
};

export type LandingContent = { [K in LandingSectionKey]: LandingSection<K> };

export function isLandingSectionKey(v: string): v is LandingSectionKey {
  return Object.prototype.hasOwnProperty.call(landingSchemas, v);
}
