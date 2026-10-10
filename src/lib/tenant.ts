import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import type { Tenant } from "@prisma/client";

export const TENANT_HEADER = "x-tenant-slug";

export async function getTenantSlugFromHeaders(): Promise<string | null> {
  const h = await headers();
  return h.get(TENANT_HEADER);
}

export async function requireTenant(): Promise<Tenant> {
  const slug = await getTenantSlugFromHeaders();
  if (!slug) notFound();

  const tenant = await prisma.tenant.findFirst({
    where: { slug, active: true },
  });

  if (!tenant) notFound();
  return tenant;
}

export async function getTenantProducts(tenantId: string) {
  return prisma.product.findMany({
    where: { tenantId, active: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
}

export async function getTenantDeliveryZones(tenantId: string) {
  return prisma.deliveryZone.findMany({
    where: { tenantId, active: true },
    orderBy: { name: "asc" },
  });
}
