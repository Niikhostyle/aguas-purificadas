import { PrismaClient } from "@prisma/client";
import { hashSync } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = hashSync("admin123", 10);

  const tenant = await prisma.tenant.upsert({
    where: { slug: "rio-claro" },
    update: {
      name: "Aguas Río Claro",
      tagline: "Agua purificada a domicilio en el Maule",
      about:
        "Somos una empresa familiar de Talca dedicada a llevar agua purificada de calidad a hogares y oficinas. Filtramos, ozonizamos y envasamos cada bidón con estándares de higiene exigentes, y despachamos en rutas diarias por la región del Maule.",
      primaryColor: "#0A6B5C",
      secondaryColor: "#1A8A9A",
      phone: "+56 71 234 5678",
      email: "contacto@aguasrioclaro.demo",
      whatsapp: "+56912345678",
      address: "Av. Circunvalación 1250",
      city: "Talca",
      region: "Maule",
      active: true,
    },
    create: {
      slug: "rio-claro",
      name: "Aguas Río Claro",
      tagline: "Agua purificada a domicilio en el Maule",
      about:
        "Somos una empresa familiar de Talca dedicada a llevar agua purificada de calidad a hogares y oficinas. Filtramos, ozonizamos y envasamos cada bidón con estándares de higiene exigentes, y despachamos en rutas diarias por la región del Maule.",
      primaryColor: "#0A6B5C",
      secondaryColor: "#1A8A9A",
      phone: "+56 71 234 5678",
      email: "contacto@aguasrioclaro.demo",
      whatsapp: "+56912345678",
      address: "Av. Circunvalación 1250",
      city: "Talca",
      region: "Maule",
      active: true,
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

  console.log("Seed OK — tenant:", tenant.slug);
  console.log("Admin: admin@rio-claro.demo / admin123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
