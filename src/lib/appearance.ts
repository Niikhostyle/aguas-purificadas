import type { Tenant } from "@prisma/client";
import type { CSSProperties } from "react";
import { z } from "zod";
import {
  STOREFRONT_PRIMARY,
  STOREFRONT_SECONDARY,
  deepenHex,
  themeFromColors,
} from "@/lib/branding";

type Base = { primary: string; secondary: string };

/** Every color the tenant can override; defaults keep untouched tenants looking as before. */
export const COLOR_DEFAULTS = {
  storeTopbarBg: (b: Base) => b.primary,
  storeTopbarText: () => "#ffffff",
  storeHeaderBg: () => "#ffffff",
  storeHeaderText: (b: Base) => b.secondary,
  storeHeaderHover: (b: Base) => b.primary,
  storeButtonBg: (b: Base) => b.primary,
  storeButtonBg2: (b: Base) => b.secondary,
  storeButtonText: () => "#ffffff",
  storeHeroOverlay: () => "#12326e",
  storeFooterBg: (b: Base) => b.secondary,
  storeFooterText: () => "#ffffff",
  adminSidebarBg: () => "#0b1f3a",
  adminSidebarBg2: () => "#12326e",
  adminSidebarText: () => "#c9dcec",
  adminActiveBg: () => "#00b1e2",
  adminActiveText: () => "#ffffff",
  adminHoverBg: () => "#1e314a",
  adminTopbarBg: () => "#ffffff",
  adminTopbarText: () => "#12233d",
  kpiBrandBg: () => "#00b1e2",
  kpiBrandText: () => "#ffffff",
  kpiNavyBg: () => "#12326e",
  kpiNavyText: () => "#ffffff",
  kpiInfoBg: () => "#00a6f4",
  kpiInfoText: () => "#ffffff",
  kpiSuccessBg: () => "#00bc7d",
  kpiSuccessText: () => "#ffffff",
  kpiWarningBg: () => "#fe9a00",
  kpiWarningText: () => "#ffffff",
  kpiDangerBg: () => "#fb2c36",
  kpiDangerText: () => "#ffffff",
} satisfies Record<string, (b: Base) => string>;

export type ColorKey = keyof typeof COLOR_DEFAULTS;
export const COLOR_KEYS = Object.keys(COLOR_DEFAULTS) as ColorKey[];

export const IMAGE_KEYS = [
  "faviconUrl",
  "logoDarkUrl",
  "panelLogoUrl",
  "loginBgUrl",
  "loginLogoUrl",
] as const;
export type ImageKey = (typeof IMAGE_KEYS)[number];

export const KPI_TONES = ["brand", "navy", "info", "success", "warning", "danger"] as const;
export type KpiToneKey = (typeof KPI_TONES)[number];

export const HEX_RE = /^#[0-9a-fA-F]{6}$/;
const UPLOAD_RE = /^\/uploads\/[a-z0-9_-]{1,40}\/appearance\/[a-z0-9-]{1,64}\.(png|jpg|webp|gif|svg|ico)$/;

const hex = z.string().trim().regex(HEX_RE).transform((v) => v.toLowerCase());
const uploadUrl = z.string().trim().max(200).regex(UPLOAD_RE);

const shape = {
  ...(Object.fromEntries(COLOR_KEYS.map((k) => [k, hex.optional()])) as Record<
    ColorKey,
    z.ZodOptional<typeof hex>
  >),
  ...(Object.fromEntries(IMAGE_KEYS.map((k) => [k, uploadUrl.optional()])) as Record<
    ImageKey,
    z.ZodOptional<typeof uploadUrl>
  >),
  storeButtonGradient: z.boolean().optional(),
  storeHeroOpacity: z.number().int().min(0).max(100).optional(),
  adminSidebarGradient: z.boolean().optional(),
  kpiStyle: z.enum(["icon", "filled"]).optional(),
  kpiGradient: z.boolean().optional(),
  loginTitle: z.string().trim().max(60).optional(),
  panelSubtitle: z.string().trim().max(40).optional(),
};

/** Strict: used to validate what the admin submits. */
export const appearanceSchema = z.object(shape).strict();
export type AppearanceOverrides = z.infer<typeof appearanceSchema>;

/** Lenient: a single bad stored key never breaks rendering. */
const storedSchema = z.object(
  Object.fromEntries(
    Object.entries(shape).map(([k, s]) => [k, (s as z.ZodType<unknown>).catch(undefined)]),
  ) as unknown as typeof shape,
);

export function parseAppearance(raw: unknown): AppearanceOverrides {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const parsed = storedSchema.safeParse(raw);
  if (!parsed.success) return {};
  return Object.fromEntries(
    Object.entries(parsed.data).filter(([, v]) => v !== undefined && v !== ""),
  ) as AppearanceOverrides;
}

export const DEFAULT_HERO_OPACITY = 88;
export const DEFAULT_LOGIN_TITLE = "Panel empresa";
export const DEFAULT_PANEL_SUBTITLE = "Panel de empresa";

export function baseColors(tenant: Pick<Tenant, "primaryColor" | "secondaryColor">): Base {
  return {
    primary: (tenant.primaryColor || STOREFRONT_PRIMARY).toLowerCase(),
    secondary: (tenant.secondaryColor || STOREFRONT_SECONDARY).toLowerCase(),
  };
}

export function colorDefaults(base: Base): Record<ColorKey, string> {
  return Object.fromEntries(
    COLOR_KEYS.map((k) => [k, COLOR_DEFAULTS[k](base).toLowerCase()]),
  ) as Record<ColorKey, string>;
}

export type ResolvedAppearance = {
  colors: Record<ColorKey, string>;
  storeButtonGradient: boolean;
  storeHeroOpacity: number;
  heroCustomized: boolean;
  adminSidebarGradient: boolean;
  kpiStyle: "icon" | "filled";
  kpiGradient: boolean;
  loginTitle: string;
  panelSubtitle: string;
  images: Partial<Record<ImageKey, string>>;
};

export function resolveAppearance(base: Base, o: AppearanceOverrides): ResolvedAppearance {
  const defaults = colorDefaults(base);
  const colors = { ...defaults };
  for (const k of COLOR_KEYS) if (o[k]) colors[k] = o[k]!;
  const images: Partial<Record<ImageKey, string>> = {};
  for (const k of IMAGE_KEYS) if (o[k]) images[k] = o[k];
  return {
    colors,
    storeButtonGradient: o.storeButtonGradient ?? false,
    storeHeroOpacity: o.storeHeroOpacity ?? DEFAULT_HERO_OPACITY,
    heroCustomized: o.storeHeroOverlay !== undefined || o.storeHeroOpacity !== undefined,
    adminSidebarGradient: o.adminSidebarGradient ?? false,
    kpiStyle: o.kpiStyle ?? "icon",
    kpiGradient: o.kpiGradient ?? false,
    loginTitle: o.loginTitle || DEFAULT_LOGIN_TITLE,
    panelSubtitle: o.panelSubtitle || DEFAULT_PANEL_SUBTITLE,
    images,
  };
}

export function tenantAppearance(tenant: Tenant): ResolvedAppearance {
  return resolveAppearance(baseColors(tenant), parseAppearance(tenant.appearance));
}

/** Drops values equal to their defaults so uncustomized fields keep following the brand colors. */
export function compactOverrides(base: Base, o: AppearanceOverrides): AppearanceOverrides {
  const defaults = colorDefaults(base);
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(o)) {
    if (v === undefined || v === "") continue;
    if (k in defaults && defaults[k as ColorKey] === v) continue;
    if (k === "storeButtonGradient" || k === "adminSidebarGradient" || k === "kpiGradient") {
      if (v === false) continue;
    }
    if (k === "storeHeroOpacity" && v === DEFAULT_HERO_OPACITY) continue;
    if (k === "kpiStyle" && v === "icon") continue;
    if (k === "loginTitle" && v === DEFAULT_LOGIN_TITLE) continue;
    if (k === "panelSubtitle" && v === DEFAULT_PANEL_SUBTITLE) continue;
    out[k] = v;
  }
  return out as AppearanceOverrides;
}

function rgba(hexColor: string, alpha: number) {
  const n = parseInt(hexColor.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${Math.round(alpha * 1000) / 1000})`;
}

export const DEFAULT_HERO_OVERLAY =
  "linear-gradient(105deg,rgba(18,50,110,0.88) 0%,rgba(0,177,226,0.4) 55%,rgba(0,0,0,0.2) 100%)";

export function heroOverlay(a: ResolvedAppearance): string {
  if (!a.heroCustomized) return DEFAULT_HERO_OVERLAY;
  const c = a.colors.storeHeroOverlay;
  const op = a.storeHeroOpacity / 100;
  return `linear-gradient(105deg,${rgba(c, op)} 0%,${rgba(c, op * 0.45)} 55%,rgba(0,0,0,${Math.round(op * 0.23 * 100) / 100}) 100%)`;
}

export function fill(from: string, to: string, gradient: boolean) {
  return gradient ? `linear-gradient(135deg,${from} 0%,${to} 100%)` : from;
}

export function storefrontThemeVars(base: Base, a: ResolvedAppearance): CSSProperties {
  const c = a.colors;
  return {
    ...themeFromColors(base.primary, base.secondary),
    ["--topbar" as string]: c.storeTopbarBg,
    ["--topbar-text" as string]: c.storeTopbarText,
    ["--header-bg" as string]: c.storeHeaderBg,
    ["--nav-text" as string]: c.storeHeaderText,
    ["--header-hover" as string]: c.storeHeaderHover,
    ["--primary" as string]: c.storeButtonBg,
    ["--primary-foreground" as string]: c.storeButtonText,
    ["--btn-fill" as string]: fill(c.storeButtonBg, c.storeButtonBg2, a.storeButtonGradient),
    ["--btn-text" as string]: c.storeButtonText,
    ["--hero-overlay" as string]: heroOverlay(a),
    ["--footer-bg" as string]: c.storeFooterBg,
    ["--footer-text" as string]: c.storeFooterText,
  } as CSSProperties;
}

export function tenantStorefrontStyle(tenant: Tenant): CSSProperties {
  return storefrontThemeVars(baseColors(tenant), tenantAppearance(tenant));
}

const KPI_COLOR: Record<KpiToneKey, [ColorKey, ColorKey]> = {
  brand: ["kpiBrandBg", "kpiBrandText"],
  navy: ["kpiNavyBg", "kpiNavyText"],
  info: ["kpiInfoBg", "kpiInfoText"],
  success: ["kpiSuccessBg", "kpiSuccessText"],
  warning: ["kpiWarningBg", "kpiWarningText"],
  danger: ["kpiDangerBg", "kpiDangerText"],
};

export function kpiToneColors(a: ResolvedAppearance, tone: KpiToneKey) {
  const [bg, text] = KPI_COLOR[tone];
  return { bg: a.colors[bg], text: a.colors[text] };
}

export function kpiFill(a: ResolvedAppearance, tone: KpiToneKey) {
  const { bg } = kpiToneColors(a, tone);
  return fill(bg, deepenHex(bg, 0.3), a.kpiGradient);
}

export function adminThemeVars(a: ResolvedAppearance): CSSProperties {
  const c = a.colors;
  const vars: Record<string, string> = {
    ...(themeFromColors(STOREFRONT_PRIMARY, STOREFRONT_SECONDARY) as Record<string, string>),
    "--admin-sidebar-fill": fill(c.adminSidebarBg, c.adminSidebarBg2, a.adminSidebarGradient),
    "--admin-sidebar-text": c.adminSidebarText,
    "--admin-active-bg": c.adminActiveBg,
    "--admin-active-text": c.adminActiveText,
    "--admin-hover-bg": c.adminHoverBg,
    "--admin-topbar-bg": c.adminTopbarBg,
    "--admin-topbar-text": c.adminTopbarText,
  };
  for (const tone of KPI_TONES) {
    const { text } = kpiToneColors(a, tone);
    vars[`--kpi-${tone}-bg`] = kpiToneColors(a, tone).bg;
    vars[`--kpi-${tone}-fill`] = kpiFill(a, tone);
    vars[`--kpi-${tone}-text`] = text;
  }
  return vars as CSSProperties;
}

export const PLATFORM_APPEARANCE = resolveAppearance(
  { primary: STOREFRONT_PRIMARY.toLowerCase(), secondary: STOREFRONT_SECONDARY.toLowerCase() },
  {},
);
