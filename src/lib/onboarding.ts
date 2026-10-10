import { hashSync } from "bcryptjs";
import {
  IntegrationApiKeys,
  IntegrationCommerceCodes,
} from "transbank-sdk";
import { encryptSecret } from "@/lib/crypto";
import { prisma } from "@/lib/db";
import { isValidHexColor } from "@/lib/branding";

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
  adminPassword: string;
  /** Seed a small default catalog + zones */
  withSampleCatalog?: boolean;
  /** Attach Transbank integration sandbox credentials */
  withSandboxWebpay?: boolean;
};

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
}

export async function createTenantOnboarding(input: CreateTenantInput) {
  const slug = slugify(input.slug);
  if (slug.length < 2) {
    throw new Error("El slug debe tener al menos 2 caracteres");
  }
  if (slug === "plataforma" || slug === "www" || slug === "admin") {
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

  const passwordHash = hashSync(input.adminPassword, 10);

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
      whatsapp: input.whatsapp?.trim() || null,
      address: input.address?.trim() || null,
      city: input.city?.trim() || null,
      region: input.region?.trim() || null,
      active: true,
      adminUsers: {
        create: {
          email: input.adminEmail.trim().toLowerCase(),
          passwordHash,
          name: input.adminName.trim(),
          role: "admin",
        },
      },
    },
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
