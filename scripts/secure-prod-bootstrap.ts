/**
 * One-time / ops bootstrap for production VPS.
 * Reads secrets ONLY from environment — never commit values.
 *
 * Env:
 *   DATABASE_URL
 *   SUPER_ADMIN_EMAIL
 *   SUPER_ADMIN_PASSWORD
 *   DEMO_ADMIN_EMAIL (optional, default admin@demo.local)
 *   DEMO_ADMIN_PASSWORD (required if keeping demo tenant)
 *   KEEP_DEMO_TENANT=1 (default) | 0 to delete demo too
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
    process.env.ADMIN_SESSION_SECRET;
  if (!raw) throw new Error("WEBPAY_CREDENTIALS_KEY or ADMIN_SESSION_SECRET required");
  const key = createHash("sha256").update(raw).digest();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64url");
}

function requireStrong(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`Missing ${name}`);
  if (v.length < 12 && name.includes("PASSWORD")) {
    throw new Error(`${name} too short`);
  }
  if (name.includes("PASSWORD") && /^(admin123|password|changeme)$/i.test(v)) {
    throw new Error(`${name} rejected as weak`);
  }
  return v;
}

async function main() {
  const superEmail = requireStrong("SUPER_ADMIN_EMAIL").toLowerCase();
  const superPassword = requireStrong("SUPER_ADMIN_PASSWORD");
  const keepDemo = process.env.KEEP_DEMO_TENANT !== "0";
  const demoEmail = (
    process.env.DEMO_ADMIN_EMAIL || "admin@demo.local"
  ).toLowerCase();
  const demoPassword = keepDemo
    ? requireStrong("DEMO_ADMIN_PASSWORD")
    : null;

  const superHash = hashSync(superPassword, 12);

  // Delete all tenants except plataforma (and optionally recreate demo)
  const all = await prisma.tenant.findMany({ select: { id: true, slug: true } });
  for (const t of all) {
    if (t.slug === "plataforma") continue;
    if (keepDemo && t.slug === "demo") continue;
    await prisma.tenant.delete({ where: { id: t.id } });
    console.log("Deleted tenant", t.slug);
  }

  // Wipe all admin users then recreate only super (+ demo admin)
  await prisma.adminUser.deleteMany({});

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
    },
  });

  await prisma.adminUser.create({
    data: {
      tenantId: platform.id,
      email: superEmail,
      passwordHash: superHash,
      name: "Super Admin",
      role: "super_admin",
    },
  });
  console.log("Super-admin set for", superEmail);

  if (keepDemo && demoPassword) {
    const demoHash = hashSync(demoPassword, 12);
    const demoBrand = {
      name: "Demo MiBidón",
      tagline: "Agua purificada para hogar y empresa",
      about:
        "Tienda demo de MiBidón con módulos activables inspirados en experiencias de marcas de agua en Chile.",
      primaryColor: "#00B1E2",
      secondaryColor: "#12326E",
      logoUrl: "/brand/rio-claro/logo.png",
      phone: "+56 2 2123 4567",
      email: "hola@demo.mibidon.cl",
      whatsapp: "+56912345678",
      address: "Chile",
      city: "Santiago",
      region: "Región Metropolitana",
      deliveryBanner:
        "Despacho a comunas seleccionadas. Elegí tu ciudad en el selector.",
      hoursBanner:
        "Horario: Lunes a Viernes 8:30–17:30 · Sábado 09:00–13:00",
      heroImageUrl: "/brand/rio-claro/destacado-01.jpg",
      heroHeadline: "Agua purificada para tu hogar y tu empresa",
      heroBody:
        "Pedí online, personalizá módulos desde el admin y cobrá con WebPay.",
      coverageText: "Cobertura demo en principales ciudades de Chile.",
      instagramUrl: "https://www.instagram.com/",
      youtubeUrl: "https://www.youtube.com/",
      modulesEnabled: DEFAULT_MODULE_FLAGS,
      modulesContent: defaultDemoModulesContent(),
      active: true as const,
    };

    const demo = await prisma.tenant.upsert({
      where: { slug: "demo" },
      update: demoBrand,
      create: { slug: "demo", ...demoBrand },
    });

    await prisma.adminUser.create({
      data: {
        tenantId: demo.id,
        email: demoEmail,
        passwordHash: demoHash,
        name: "Admin Demo",
        role: "admin",
      },
    });

    const { RIO_CLARO_PRODUCTS } = await import("./seed-rio-products");
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

    await prisma.deliveryZone.deleteMany({ where: { tenantId: demo.id } });
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

    console.log("Demo tenant ready; admin email:", demoEmail);
    console.log("DEMO_ADMIN_PASSWORD was set via env (not printed).");
  }

  console.log("Bootstrap complete. Old demo logins removed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
