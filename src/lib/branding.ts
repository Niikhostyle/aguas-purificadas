import type { Tenant } from "@prisma/client";
import type { CSSProperties } from "react";

export function deepenHex(hex: string, amount = 0.22): string {
  const raw = hex.replace("#", "").trim();
  if (!/^[0-9a-fA-F]{6}$/.test(raw)) return "#12326e";
  const n = parseInt(raw, 16);
  const r = Math.max(0, Math.round(((n >> 16) & 255) * (1 - amount)));
  const g = Math.max(0, Math.round(((n >> 8) & 255) * (1 - amount)));
  const b = Math.max(0, Math.round((n & 255) * (1 - amount)));
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

export function lightenHex(hex: string, amount = 0.85): string {
  const raw = hex.replace("#", "").trim();
  if (!/^[0-9a-fA-F]{6}$/.test(raw)) return "#e8f7fc";
  const n = parseInt(raw, 16);
  const mix = (c: number) => Math.min(255, Math.round(c + (255 - c) * amount));
  const r = mix((n >> 16) & 255);
  const g = mix((n >> 8) & 255);
  const b = mix(n & 255);
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

/** Storefront / aguasrioclaro.cl reference — used for all admin chrome. */
export const STOREFRONT_PRIMARY = "#00B1E2";
export const STOREFRONT_SECONDARY = "#12326E";

export function themeFromColors(
  primary: string,
  secondary: string,
): CSSProperties {
  const deep = secondary;
  const mist = lightenHex(primary, 0.9);
  const accent = lightenHex(primary, 0.82);

  return {
    ["--brand" as string]: primary,
    ["--brand-deep" as string]: deep,
    ["--mist" as string]: mist,
    ["--topbar" as string]: primary,
    ["--nav-text" as string]: deep,
    ["--primary" as string]: primary,
    ["--primary-foreground" as string]: "#ffffff",
    ["--ring" as string]: primary,
    ["--secondary" as string]: accent,
    ["--secondary-foreground" as string]: deep,
    ["--accent" as string]: accent,
    ["--accent-foreground" as string]: deep,
  } as CSSProperties;
}

export function tenantThemeStyle(tenant: Tenant): CSSProperties {
  return themeFromColors(
    tenant.primaryColor || STOREFRONT_PRIMARY,
    tenant.secondaryColor || STOREFRONT_SECONDARY,
  );
}

/** Admin panels always match the main storefront cyan/navy family. */
export function adminThemeStyle(): CSSProperties {
  return themeFromColors(STOREFRONT_PRIMARY, STOREFRONT_SECONDARY);
}

export function isValidHexColor(value: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(value.trim());
}
