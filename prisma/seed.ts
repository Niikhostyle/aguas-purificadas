/**
 * Local/dev seed. NEVER embeds production passwords.
 *
 * Required for admin users (local):
 *   SEED_SUPER_ADMIN_EMAIL, SEED_SUPER_ADMIN_PASSWORD
 *   SEED_DEMO_ADMIN_EMAIL, SEED_DEMO_ADMIN_PASSWORD
 *
 * Production: use `scripts/secure-prod-bootstrap.ts` with env on the server.
 * Set SEED_ALLOW_DEV=1 to allow this seed outside development.
 */
import { PrismaClient } from "@prisma/client";
import { hashSync } from "bcryptjs";
import { createCipheriv, createHash, randomBytes } from "crypto";
import {
  IntegrationApiKeys,
  IntegrationCommerceCodes,
} from "transbank-sdk";
import {
  DEFAULT_MODULE_FLAGS,
  defaultDemoModulesContent,
} from "../src/lib/modules";

const prisma = new PrismaClient();

function encryptSecret(plain: string): string {
  const raw =
    process.env.WEBPAY_CREDENTIALS_KEY ||
    process.env.ADMIN_SESSION_SECRET ||
    "dev-webpay-credentials-key";
  const key = createHash("sha256").update(raw).digest();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64url");
}

function requireEnv(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) {
    throw new Error(
      `Missing ${name}. Dev seed refuses weak defaults — set env vars or run secure-prod-bootstrap on the server.`,
    );
  }
  if (v.length < 12 && name.includes("PASSWORD")) {
    throw new Error(`${name} must be at least 12 characters`);
  }
  if (/admin123|password|changeme/i.test(v)) {
    throw new Error(`${name} looks like a weak/default password`);
  }
  return v;
}

async function main() {
  if (
    process.env.NODE_ENV === "production" &&
    process.env.SEED_ALLOW_DEV !== "1"
  ) {
    throw new Error(
      "Refusing to run prisma/seed.ts in production. Use scripts/secure-prod-bootstrap.ts",
    );
  }

  const superEmail = requireEnv("SEED_SUPER_ADMIN_EMAIL").toLowerCase();
  const superPassword = requireEnv("SEED_SUPER_ADMIN_PASSWORD");
  const demoEmail = requireEnv("SEED_DEMO_ADMIN_EMAIL").toLowerCase();
  const demoPassword = requireEnv("SEED_DEMO_ADMIN_PASSWORD");

  const superHash = hashSync(superPassword, 12);
  const demoHash = hashSync(demoPassword, 12);

  const demoBrand = {
    name: "Demo MiBidón",
    tagline: "Agua purificada para hogar y empresa",
    about:
      "Tienda demo de MiBidón: experiencia inspirada en marcas líderes de agua en Chile, con módulos activables (hogar/empresa, descuentos, planes, kits, redes y certificaciones).",
    primaryColor: "#00B1E2",
    secondaryColor: "#12326E",
    logoUrl: "/brand/rio-claro/logo.png",
    phone: "+56 2 2123 4567",
    phoneSecondary: null as string | null,
    email: "hola@demo.mibidon.cl",
    whatsapp: "+56912345678",
    address: "Chile",
    city: "Santiago",
    region: "Región Metropolitana",
    deliveryBanner:
      "Despacho a comunas seleccionadas. Elegí tu ciudad en el selector de región.",
    hoursBanner:
      "Horario de atención: Lunes a Viernes 8:30–17:30 · Sábado 09:00–13:00",
    heroImageUrl: "/brand/rio-claro/destacado-01.jpg",
    heroHeadline: "Agua purificada para tu hogar y tu empresa",
    heroBody:
      "Pedí online, activá los módulos que necesites desde el admin y cobrá con WebPay.",
    coverageText:
      "Cobertura demo en Santiago, Valparaíso, Maule, Biobío y Araucanía.",
    facebookUrl: "https://www.facebook.com/",
    instagramUrl: "https://www.instagram.com/",
    twitterUrl: null as string | null,
    youtubeUrl: "https://www.youtube.com/",
    modulesEnabled: DEFAULT_MODULE_FLAGS,
    modulesContent: defaultDemoModulesContent(),
    active: true as const,
  };

  const demo = await prisma.tenant.upsert({
    where: { slug: "demo" },
    update: demoBrand,
    create: {
      slug: "demo",
      ...demoBrand,
      adminUsers: {
        create: {
          email: demoEmail,
          passwordHash: demoHash,
          name: "Admin Demo",
          role: "admin",
        },
      },
    },
  });

  await prisma.adminUser.upsert({
    where: {
      tenantId_email: { tenantId: demo.id, email: demoEmail },
    },
    update: { passwordHash: demoHash, name: "Admin Demo", role: "admin" },
    create: {
      tenantId: demo.id,
      email: demoEmail,
      passwordHash: demoHash,
      name: "Admin Demo",
      role: "admin",
    },
  });

  const { RIO_CLARO_PRODUCTS } = await import("../scripts/seed-rio-products");
  await prisma.product.deleteMany({ where: { tenantId: demo.id } });
  await prisma.product.createMany({
    data: RIO_CLARO_PRODUCTS.slice(0, 6).map((p) => ({
      tenantId: demo.id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      priceClp: p.priceClp,
      imageUrl: p.imageUrl,
      sortOrder: p.sortOrder,
      active: true,
    })),
  });

  const zoneCount = await prisma.deliveryZone.count({
    where: { tenantId: demo.id },
  });
  if (zoneCount === 0) {
    await prisma.deliveryZone.createMany({
      data: [
        {
          tenantId: demo.id,
          name: "Santiago centro",
          communes: "Santiago, Providencia, Ñuñoa",
          costClp: 0,
        },
        {
          tenantId: demo.id,
          name: "Gran Santiago",
          communes: "Maipú, La Florida, Puente Alto",
          costClp: 1990,
        },
      ],
    });
  }

  await prisma.webPayCredential.upsert({
    where: { tenantId: demo.id },
    update: {
      commerceCode: IntegrationCommerceCodes.WEBPAY_PLUS,
      apiKeyEncrypted: encryptSecret(IntegrationApiKeys.WEBPAY),
      environment: "integration",
      active: true,
    },
    create: {
      tenantId: demo.id,
      commerceCode: IntegrationCommerceCodes.WEBPAY_PLUS,
      apiKeyEncrypted: encryptSecret(IntegrationApiKeys.WEBPAY),
      environment: "integration",
      active: true,
    },
  });

  const platform = await prisma.tenant.upsert({
    where: { slug: "plataforma" },
    update: {
      name: "MiBidón",
      tagline: "Operación multi-empresa",
      primaryColor: "#00B1E2",
      secondaryColor: "#12326E",
      active: true,
    },
    create: {
      slug: "plataforma",
      name: "MiBidón",
      tagline: "Operación multi-empresa",
      primaryColor: "#00B1E2",
      secondaryColor: "#12326E",
      active: true,
      adminUsers: {
        create: {
          email: superEmail,
          passwordHash: superHash,
          name: "Super Admin",
          role: "super_admin",
        },
      },
    },
  });

  await prisma.adminUser.upsert({
    where: {
      tenantId_email: { tenantId: platform.id, email: superEmail },
    },
    update: {
      passwordHash: superHash,
      role: "super_admin",
      name: "Super Admin",
    },
    create: {
      tenantId: platform.id,
      email: superEmail,
      passwordHash: superHash,
      name: "Super Admin",
      role: "super_admin",
    },
  });

  // Remove legacy demo tenants / weak accounts if present
  await prisma.tenant.deleteMany({
    where: {
      slug: { in: ["rio-claro", "manantial-andes"] },
    },
  });
  await prisma.adminUser.deleteMany({
    where: {
      email: {
        in: [
          "super@plataforma.demo",
          "admin@rio-claro.demo",
          "admin@manantial-andes.demo",
        ],
      },
    },
  });

  console.log("Seed OK (passwords from env, not logged)");
  console.log("  tenants: demo, plataforma");
  console.log("  super-admin email:", superEmail);
  console.log("  demo admin email:", demoEmail);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
