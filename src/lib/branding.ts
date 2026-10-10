import type { Tenant } from "@prisma/client";
import type { CSSProperties } from "react";

/** Derive a darker companion from a hex color for headings / hover. */
export function deepenHex(hex: string, amount = 0.22): string {
  const raw = hex.replace("#", "").trim();
  if (!/^[0-9a-fA-F]{6}$/.test(raw)) return "#064a40";
  const n = parseInt(raw, 16);
  const r = Math.max(0, Math.round(((n >> 16) & 255) * (1 - amount)));
  const g = Math.max(0, Math.round(((n >> 8) & 255) * (1 - amount)));
  const b = Math.max(0, Math.round((n & 255) * (1 - amount)));
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

export function lightenHex(hex: string, amount = 0.85): string {
  const raw = hex.replace("#", "").trim();
  if (!/^[0-9a-fA-F]{6}$/.test(raw)) return "#e8f4f1";
  const n = parseInt(raw, 16);
  const mix = (c: number) => Math.min(255, Math.round(c + (255 - c) * amount));
  const r = mix((n >> 16) & 255);
  const g = mix((n >> 8) & 255);
  const b = mix(n & 255);
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

export function tenantThemeStyle(tenant: Tenant): CSSProperties {
  const primary = tenant.primaryColor || "#0a6b5c";
  const secondary = tenant.secondaryColor || "#1a8a9a";
  const deep = deepenHex(primary);
  const mist = lightenHex(primary, 0.9);
  const accent = lightenHex(secondary, 0.75);

  return {
    ["--brand" as string]: primary,
    ["--brand-deep" as string]: deep,
    ["--mist" as string]: mist,
    ["--primary" as string]: primary,
    ["--primary-foreground" as string]: "#f4fffc",
    ["--ring" as string]: secondary,
    ["--secondary" as string]: accent,
    ["--secondary-foreground" as string]: deep,
    ["--accent" as string]: accent,
    ["--accent-foreground" as string]: deep,
  } as CSSProperties;
}

export function isValidHexColor(value: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(value.trim());
}
