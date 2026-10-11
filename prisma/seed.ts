import { PrismaClient } from "@prisma/client";
import { hashSync } from "bcryptjs";
import { createCipheriv, createHash, randomBytes } from "crypto";
import {
  IntegrationApiKeys,
  IntegrationCommerceCodes,
} from "transbank-sdk";

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

async function main() {
  const passwordHash = hashSync("admin123", 10);

  const rioClaroBrand = {
    name: "Aguas Río Claro",
    tagline: "Agua purificada libre de sodio y de alta pureza",
    about:
      "El proceso de purificación es por multietapas, comenzando por agua de red domiciliaria que luego de pasar por 5 etapas o procesos de purificación se obtiene como resultado Agua Purificada no mineral y libre de sodio. Desde Curicó y Talca atendemos hogares y empresas del Maule con contacto garantizado semanal (CGS).",
    primaryColor: "#00B1E2",
    secondaryColor: "#12326E",
    logoUrl: "/brand/rio-claro/logo.png",
    phone: "+56 75 2 544575",
    phoneSecondary: "+56 75 2 380007",
    email: "contacto@aguasrioclaro.demo",
    whatsapp: "+56912345678",
    address: "Curicó / Talca",
    city: "Curicó",
    region: "Maule",
    deliveryBanner:
      "Despacho para Talca, Curicó, Linares, San Javier, San Clemente, San Rafael, Molina, Lontué, Teno, Rauco, Hualañé, Licantén, San Fernando, Chimbarongo, Sagrada Familia y Romeral.",
    hoursBanner:
      "Horario de atención telefónica, Lunes a Viernes de 8:30 a 13:00 hrs y 14:00 a 17:30 hrs. - Sábado de 09:00 a 13:00 hrs.",
    heroImageUrl: "/brand/rio-claro/hero.jpg",
    heroHeadline: "Soluciones integrales de agua purificada",
    heroBody:
      "El proceso de purificación es por multietapas, comenzando por agua de red domiciliaria que luego de pasar por 5 etapas o procesos de purificación se obtiene como resultado Agua Purificada no mineral y libre de sodio.",
    coverageText:
      "Nos esmeramos día a día por nuestros clientes, sabemos que para ellos el agua debe llegar a tiempo. (Contacto garantizado semanal CGS). Despacho a Talca, Curicó, Linares, San Javier, San Clemente, San Rafael, Molina, Lontué, Teno, Rauco, Hualañé, Licantén, San Fernando, Chimbarongo, Sagrada Familia, Romeral.",
    facebookUrl: "https://www.facebook.com/aguasrioclaro/",
    instagramUrl: "https://www.instagram.com/aguasrioclaro/",
    twitterUrl: "https://twitter.com/aguasrioclaro",
    active: true as const,
  };

  const tenant = await prisma.tenant.upsert({
    where: { slug: "rio-claro" },
    update: rioClaroBrand,
    create: {
      slug: "rio-claro",
      ...rioClaroBrand,
      adminUsers: {
        create: {
          email: "admin@rio-claro.demo",
          passwordHash,
          name: "Admin Río Claro",
          role: "admin",
        },
      },
    },
  });

  // Ensure admin exists on re-seed (upsert path may skip nested create)
  await prisma.adminUser.upsert({
    where: {
      tenantId_email: {
        tenantId: tenant.id,
        email: "admin@rio-claro.demo",
      },
    },
    update: { passwordHash, name: "Admin Río Claro" },
    create: {
      tenantId: tenant.id,
      email: "admin@rio-claro.demo",
      passwordHash,
      name: "Admin Río Claro",
      role: "admin",
    },
  });

  // Sync catalog from reference site assets
  const { RIO_CLARO_PRODUCTS } = await import("../scripts/seed-rio-products");
  await prisma.product.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.product.createMany({
    data: RIO_CLARO_PRODUCTS.map((p) => ({
      tenantId: tenant.id,
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
    where: { tenantId: tenant.id },
  });
  if (zoneCount === 0) {
    await prisma.deliveryZone.createMany({
      data: [
        {
          tenantId: tenant.id,
          name: "Talca centro",
          communes: "Talca",
          costClp: 0,
        },
        {
          tenantId: tenant.id,
          name: "Gran Talca",
          communes: "Maule, San Clemente, Pencahue",
          costClp: 1500,
        },
        {
          tenantId: tenant.id,
          name: "Curicó y Linares",
          communes: "Curicó, Linares, Villa Alegre",
          costClp: 2500,
        },
      ],
    });
  }

  // Transbank WebPay Plus integration commerce defaults (sandbox)
  await prisma.webPayCredential.upsert({
    where: { tenantId: tenant.id },
    update: {
      commerceCode: IntegrationCommerceCodes.WEBPAY_PLUS,
      apiKeyEncrypted: encryptSecret(IntegrationApiKeys.WEBPAY),
      environment: "integration",
      active: true,
    },
    create: {
      tenantId: tenant.id,
      commerceCode: IntegrationCommerceCodes.WEBPAY_PLUS,
      apiKeyEncrypted: encryptSecret(IntegrationApiKeys.WEBPAY),
      environment: "integration",
      active: true,
    },
  });

  // Platform tenant + super-admin
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
          email: "super@plataforma.demo",
          passwordHash,
          name: "Super Admin",
          role: "super_admin",
        },
      },
    },
  });

  await prisma.adminUser.upsert({
    where: {
      tenantId_email: {
        tenantId: platform.id,
        email: "super@plataforma.demo",
      },
    },
    update: { passwordHash, role: "super_admin", name: "Super Admin" },
    create: {
      tenantId: platform.id,
      email: "super@plataforma.demo",
      passwordHash,
      name: "Super Admin",
      role: "super_admin",
    },
  });

  // Second company for isolation demos
  const { createTenantOnboarding } = await import("../src/lib/onboarding");
  const existingSecond = await prisma.tenant.findUnique({
    where: { slug: "manantial-andes" },
  });
  if (!existingSecond) {
    await createTenantOnboarding({
      slug: "manantial-andes",
      name: "Manantial Andes",
      tagline: "Bidones frescos para el Biobío",
      about:
        "Planta en Concepción con rutas a San Pedro, Chiguayante y Talcahuano. Enfocados en oficinas y edificios con suscripción semanal.",
      primaryColor: "#0B4F6C",
      secondaryColor: "#01BAEF",
      logoUrl:
        "https://images.unsplash.com/photo-1523362628745-0c100150b504?auto=format&fit=crop&w=128&h=128&q=80",
      phone: "+56 41 234 1000",
      email: "hola@manantialandes.demo",
      whatsapp: "+56987654321",
      address: "Av. Los Carrera 880",
      city: "Concepción",
      region: "Biobío",
      adminName: "Admin Manantial",
      adminEmail: "admin@manantial-andes.demo",
      adminPassword: "admin123",
      withSampleCatalog: true,
      withSandboxWebpay: true,
    });

    // Distinct catalog prices vs Río Claro
    const andes = await prisma.tenant.findUniqueOrThrow({
      where: { slug: "manantial-andes" },
    });
    await prisma.product.deleteMany({ where: { tenantId: andes.id } });
    await prisma.product.createMany({
      data: [
        {
          tenantId: andes.id,
          name: "Bidón 12 L",
          slug: "bidon-12l",
          description: "Formato liviano para departamentos.",
          priceClp: 2800,
          sortOrder: 1,
        },
        {
          tenantId: andes.id,
          name: "Bidón 20 L premium",
          slug: "bidon-20l-premium",
          description: "Agua mineralizada suave, sello de seguridad.",
          priceClp: 4200,
          sortOrder: 2,
        },
        {
          tenantId: andes.id,
          name: "Plan oficina semanal",
          slug: "plan-oficina-semanal",
          description: "4 bidones/semana con ruta fija en Concepción.",
          priceClp: 14990,
          sortOrder: 3,
        },
      ],
    });
  }

  console.log("Seed OK");
  console.log("  rio-claro admin: admin@rio-claro.demo / admin123");
  console.log("  manantial-andes admin: admin@manantial-andes.demo / admin123");
  console.log("  plataforma super: super@plataforma.demo / admin123");
  console.log(
    "  WebPay sandbox commerce:",
    IntegrationCommerceCodes.WEBPAY_PLUS,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
