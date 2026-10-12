import { hashSync } from "bcryptjs";
import { randomBytes } from "crypto";
import {
  IntegrationApiKeys,
  IntegrationCommerceCodes,
} from "transbank-sdk";
import { encryptSecret } from "@/lib/crypto";
import { prisma } from "@/lib/db";
import { isValidHexColor } from "@/lib/branding";
import { normalizeChileWhatsapp } from "@/lib/whatsapp";

export type CreateTenantInput = {
  slug: string;
  name: string;
  tagline?: string;
  about?: string;
  primaryColor?: string;
  secondaryColor?: string;
  logoUrl?: string;
  phone?: string;
  email?: string;
  whatsapp?: string;
  address?: string;
  city?: string;
  region?: string;
  adminName: string;
  adminEmail: string;
  /** Omit to create the admin with a random unusable password (owner sets it via invite link). */
  adminPassword?: string;
  /** Seed a small default catalog + zones */
  withSampleCatalog?: boolean;
  /** Attach Transbank integration sandbox credentials */
  withSandboxWebpay?: boolean;
  /** Link to the FOSSBilling order that pays for this tenant */
  billing?: { clientId: string; orderId: string; plan?: string };
};

// Slugs double as subdomains of mibidon.cl; these hosts belong to the platform.
export const RESERVED_TENANT_SLUGS = new Set([
  "plataforma",
  "demo",
  "www",
  "app",
  "admin",
  "api",
  "mail",
  "billing",
  "mibidon",
  "smtp",
  "imap",
  "ftp",
  "ns1",
  "ns2",
  "cdn",
  "static",
  "status",
  "soporte",
  "ayuda",
  "blog",
  "staging",
  "dev",
  "test",
]);

export function normalizeTenantSlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40)
    .replace(/-$/, "");
}

export type SlugCheck =
  | { ok: true; slug: string }
  | { ok: false; slug: string; code: "invalid" | "reserved" | "taken"; message: string };

/** Normalizes a desired subdomain and checks it can be used for a new tenant. */
export async function checkTenantSlug(raw: string): Promise<SlugCheck> {
  const slug = normalizeTenantSlug(raw);
  if (slug.length < 3) {
    return {
      ok: false,
      slug,
      code: "invalid",
      message: "El subdominio debe tener al menos 3 letras o números",
    };
  }
  if (RESERVED_TENANT_SLUGS.has(slug)) {
    return { ok: false, slug, code: "reserved", message: `El subdominio "${slug}" está reservado` };
  }
  const existing = await prisma.tenant.findUnique({ where: { slug }, select: { id: true } });
  if (existing) {
    return { ok: false, slug, code: "taken", message: `El subdominio "${slug}" ya está en uso` };
  }
  return { ok: true, slug };
}

export async function createTenantOnboarding(input: CreateTenantInput) {
  const slug = normalizeTenantSlug(input.slug);
  if (slug.length < 2) {
    throw new Error("El slug debe tener al menos 2 caracteres");
  }
  if (RESERVED_TENANT_SLUGS.has(slug)) {
    throw new Error("Ese slug está reservado");
  }

  const existing = await prisma.tenant.findUnique({ where: { slug } });
  if (existing) throw new Error("Ya existe una empresa con ese slug");

  const primaryColor =
    input.primaryColor && isValidHexColor(input.primaryColor)
      ? input.primaryColor.trim()
      : "#00B1E2";
  const secondaryColor =
    input.secondaryColor && isValidHexColor(input.secondaryColor)
      ? input.secondaryColor.trim()
      : "#12326E";

  if (input.adminPassword !== undefined) {
    if (input.adminPassword.length < 12) {
      throw new Error("La contraseña del admin debe tener al menos 12 caracteres");
    }
    if (/admin123|password|changeme/i.test(input.adminPassword)) {
      throw new Error("Elegí una contraseña más segura");
    }
  }

  const whatsapp = input.whatsapp?.trim()
    ? normalizeChileWhatsapp(input.whatsapp)
    : null;
  if (input.whatsapp?.trim() && !whatsapp) {
    throw new Error("WhatsApp inválido: usa un número chileno, ej. +56 9 1234 5678");
  }

  const passwordHash = hashSync(
    input.adminPassword ?? randomBytes(32).toString("base64url"),
    12,
  );
  const { DEFAULT_MODULE_FLAGS } = await import("@/lib/modules");
  const { emptyModulesContent } = await import("@/lib/storefront-defaults");

  const tenant = await prisma.tenant.create({
    data: {
      slug,
      name: input.name.trim(),
      tagline: input.tagline?.trim() || null,
      about: input.about?.trim() || null,
      primaryColor,
      secondaryColor,
      logoUrl: input.logoUrl?.trim() || null,
      phone: input.phone?.trim() || null,
      email: input.email?.trim() || null,
      whatsapp,
      address: input.address?.trim() || null,
      city: input.city?.trim() || null,
      region: input.region?.trim() || null,
      modulesEnabled: DEFAULT_MODULE_FLAGS,
      // No demo regions/offers: the storefront shows neutral defaults until the
      // company configures its own coverage and content.
      modulesContent: emptyModulesContent(),
      active: true,
      ...(input.billing
        ? {
            billingClientId: input.billing.clientId,
            billingOrderId: input.billing.orderId,
            plan: input.billing.plan || null,
            billingStatus: "active",
            billingUpdatedAt: new Date(),
          }
        : {}),
      adminUsers: {
        create: {
          email: input.adminEmail.trim().toLowerCase(),
          passwordHash,
          name: input.adminName.trim(),
          role: "admin",
        },
      },
    },
    include: { adminUsers: true },
  });

  if (input.withSampleCatalog !== false) {
    await prisma.product.createMany({
      data: [
        {
          tenantId: tenant.id,
          name: "Bidón 20 L",
          slug: "bidon-20l",
          description:
            "Bidón retornable de 20 litros con agua purificada para hogar u oficina.",
          priceClp: 3500,
          sortOrder: 1,
        },
        {
          tenantId: tenant.id,
          name: "Pack 2 bidones",
          slug: "pack-2-bidones",
          description: "Dos bidones de 20 L a precio preferente.",
          priceClp: 6500,
          sortOrder: 2,
        },
      ],
    });
    await prisma.deliveryZone.createMany({
      data: [
        {
          tenantId: tenant.id,
          name: "Zona centro",
          communes: input.city || "Centro",
          costClp: 0,
        },
        {
          tenantId: tenant.id,
          name: "Zona extendida",
          communes: "Comunas aledañas",
          costClp: 2000,
        },
      ],
    });
  }

  if (input.withSandboxWebpay !== false) {
    await prisma.webPayCredential.create({
      data: {
        tenantId: tenant.id,
        commerceCode: IntegrationCommerceCodes.WEBPAY_PLUS,
        apiKeyEncrypted: encryptSecret(IntegrationApiKeys.WEBPAY),
        environment: "integration",
        active: true,
      },
    });
  }

  return tenant;
}
