import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import type { Tenant } from "@prisma/client";

export const TENANT_HEADER = "x-tenant-slug";
const TENANT_FROM_HOST_HEADER = "x-tenant-from-host";

export async function getTenantSlugFromHeaders(): Promise<string | null> {
  const h = await headers();
  return h.get(TENANT_HEADER);
}

/** Tenant slug only when it came from the request's own subdomain (not ?tenant= / x-tenant). */
export async function getHostTenantSlug(): Promise<string | null> {
  const h = await headers();
  return h.get(TENANT_FROM_HOST_HEADER) === "1" ? h.get(TENANT_HEADER) : null;
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
