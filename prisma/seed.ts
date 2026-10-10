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
    tagline: "Agua de manantial, ruta a tu puerta en el Maule",
    about:
      "Desde Talca llevamos más de una década purificando y repartiendo agua en bidón. Cada carga pasa por filtración, ozono y sellado en planta propia. Atendemos hogares, oficinas y comercio del Maule con rutas diarias y trato cercano — la misma agua que tomamos en casa.",
    primaryColor: "#0A6B5C",
    secondaryColor: "#1A8A9A",
    logoUrl:
      "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?auto=format&fit=crop&w=128&h=128&q=80",
    phone: "+56 71 234 5678",
    email: "contacto@aguasrioclaro.demo",
    whatsapp: "+56912345678",
    address: "Av. Circunvalación 1250",
    city: "Talca",
    region: "Maule",
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
      products: {
        create: [
          {
            name: "Bidón 20 L",
            slug: "bidon-20l",
            description:
              "Bidón retornable de 20 litros con agua purificada. Ideal para dispensadores de hogar y oficina. Incluye sello de seguridad.",
            priceClp: 3500,
            sortOrder: 1,
            active: true,
          },
          {
            name: "Pack 2 bidones 20 L",
            slug: "pack-2-bidones-20l",
            description:
              "Dos bidones de 20 litros a precio preferente. Perfecto para familias o escritorios con alto consumo.",
            priceClp: 6500,
            sortOrder: 2,
            active: true,
          },
          {
            name: "Dispensador de mesa",
            slug: "dispensador-mesa",
            description:
              "Dispensador manual de mesa para bidón de 20 L. Compacto, fácil de limpiar y listo para usar.",
            priceClp: 18990,
            sortOrder: 3,
            active: true,
          },
          {
            name: "Pack oficina (4 bidones)",
            slug: "pack-oficina-4-bidones",
            description:
              "Cuatro bidones de 20 L con despacho coordinado. Pensado para pymes y oficinas pequeñas del Maule.",
            priceClp: 12000,
            sortOrder: 4,
            active: true,
          },
        ],
      },
      deliveryZones: {
        create: [
          {
            name: "Talca centro",
            communes: "Talca",
            costClp: 0,
            active: true,
          },
          {
            name: "Gran Talca",
            communes: "Maule, San Clemente, Pencahue",
            costClp: 1500,
            active: true,
          },
          {
            name: "Curicó y Linares",
            communes: "Curicó, Linares, Villa Alegre",
            costClp: 2500,
            active: true,
          },
        ],
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

  const productCount = await prisma.product.count({
    where: { tenantId: tenant.id },
  });
  if (productCount === 0) {
    await prisma.product.createMany({
      data: [
        {
          tenantId: tenant.id,
          name: "Bidón 20 L",
          slug: "bidon-20l",
          description:
            "Bidón retornable de 20 litros con agua purificada. Ideal para dispensadores de hogar y oficina.",
          priceClp: 3500,
          sortOrder: 1,
        },
        {
          tenantId: tenant.id,
          name: "Pack 2 bidones 20 L",
          slug: "pack-2-bidones-20l",
          description: "Dos bidones de 20 litros a precio preferente.",
          priceClp: 6500,
          sortOrder: 2,
        },
        {
          tenantId: tenant.id,
          name: "Dispensador de mesa",
          slug: "dispensador-mesa",
          description: "Dispensador manual de mesa para bidón de 20 L.",
          priceClp: 18990,
          sortOrder: 3,
        },
        {
          tenantId: tenant.id,
          name: "Pack oficina (4 bidones)",
          slug: "pack-oficina-4-bidones",
          description: "Cuatro bidones de 20 L con despacho coordinado.",
          priceClp: 12000,
          sortOrder: 4,
        },
      ],
    });
  }

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
      name: "Aguas Purificadas Plataforma",
      tagline: "Operación multi-empresa",
      primaryColor: "#1B4332",
      secondaryColor: "#2D6A4F",
      active: true,
    },
    create: {
      slug: "plataforma",
      name: "Aguas Purificadas Plataforma",
      tagline: "Operación multi-empresa",
      primaryColor: "#1B4332",
      secondaryColor: "#2D6A4F",
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
