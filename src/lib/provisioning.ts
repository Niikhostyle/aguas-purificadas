import { Prisma } from "@prisma/client";
import { z } from "zod";
import { createAdminInvite } from "@/lib/admin-invite";
import { prisma } from "@/lib/db";
import { checkTenantSlug, createTenantOnboarding } from "@/lib/onboarding";
import { platformUrl } from "@/lib/platform-url";

/** Tenant lifecycle driven by FOSSBilling orders (billing.mibidon.cl). */

const orderId = z.coerce.string().trim().min(1).max(64);

const createFields = {
  orderId,
  clientId: z.coerce.string().trim().min(1).max(64),
  companyName: z.string().trim().min(2).max(120),
  slug: z.string().trim().min(1).max(80),
  ownerName: z.string().trim().min(2).max(120),
  ownerEmail: z.string().trim().toLowerCase().email().max(200),
  ownerPhone: z.string().trim().max(40).optional().nullable(),
  plan: z.string().trim().max(80).optional().nullable(),
};

export const provisionRequestSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("check"), slug: z.string().trim().min(1).max(80) }),
  z.object({ action: z.literal("create"), ...createFields }),
  z.object({
    action: z.literal("sync"),
    status: z.enum(["active", "suspended", "canceled"]),
    ...createFields,
  }),
  z.object({ action: z.literal("suspend"), orderId }),
  z.object({ action: z.literal("unsuspend"), orderId }),
  z.object({ action: z.literal("cancel"), orderId }),
  z.object({ action: z.literal("renew"), orderId }),
  z.object({ action: z.literal("invite"), orderId }),
]);

export type ProvisionRequest = z.infer<typeof provisionRequestSchema>;
type CreateRequest = Extract<ProvisionRequest, { action: "create" }>;

export type ProvisionResult = { status: number; body: Record<string, unknown> };

type BillingTenant = Prisma.TenantGetPayload<{ include: { adminUsers: true } }>;

function tenantView(tenant: BillingTenant) {
  return {
    id: tenant.id,
    slug: tenant.slug,
    name: tenant.name,
    url: platformUrl("/", tenant.slug),
    adminUrl: platformUrl("/admin/login", tenant.slug),
    active: tenant.active,
    billingStatus: tenant.billingStatus,
  };
}

function ownerOf(tenant: BillingTenant) {
  return [...tenant.adminUsers]
    .filter((a) => a.role !== "super_admin")
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0];
}

async function findByOrder(id: string) {
  return prisma.tenant.findUnique({
    where: { billingOrderId: id },
    include: { adminUsers: true },
  });
}

async function hasActivated(adminUserId: string) {
  const used = await prisma.adminInvite.count({
    where: { adminUserId, usedAt: { not: null } },
  });
  return used > 0;
}

/** Fresh invite only while the owner hasn't set a password yet. */
async function pendingInvite(tenant: BillingTenant) {
  const owner = ownerOf(tenant);
  if (!owner || !tenant.active) return null;
  if (await hasActivated(owner.id)) return null;
  return createAdminInvite(owner.id, tenant.slug);
}

async function create(req: CreateRequest): Promise<ProvisionResult> {
  const existing = await findByOrder(req.orderId);
  if (existing) {
    const invite = await pendingInvite(existing);
    return {
      status: 200,
      body: {
        ok: true,
        created: false,
        tenant: tenantView(existing),
        inviteUrl: invite?.url ?? null,
        inviteExpiresAt: invite?.expiresAt ?? null,
      },
    };
  }

  const slug = await checkTenantSlug(req.slug);
  if (!slug.ok) {
    return {
      status: slug.code === "taken" ? 409 : 422,
      body: { ok: false, error: `slug_${slug.code}`, slug: slug.slug, message: slug.message },
    };
  }

  let tenant: BillingTenant;
  try {
    tenant = await createTenantOnboarding({
      slug: slug.slug,
      name: req.companyName,
      email: req.ownerEmail,
      phone: req.ownerPhone || undefined,
      adminName: req.ownerName,
      adminEmail: req.ownerEmail,
      withSampleCatalog: false,
      withSandboxWebpay: false,
      billing: { clientId: req.clientId, orderId: req.orderId, plan: req.plan || undefined },
    });
  } catch (e) {
    // Concurrent create for the same order or slug: unique constraint lost the race.
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      const raced = await findByOrder(req.orderId);
      if (raced) return create(req);
      return {
        status: 409,
        body: {
          ok: false,
          error: "slug_taken",
          slug: slug.slug,
          message: `El subdominio "${slug.slug}" ya está en uso`,
        },
      };
    }
    throw e;
  }

  const owner = ownerOf(tenant);
  const invite = owner ? await createAdminInvite(owner.id, tenant.slug) : null;
  return {
    status: 201,
    body: {
      ok: true,
      created: true,
      tenant: tenantView(tenant),
      inviteUrl: invite?.url ?? null,
      inviteExpiresAt: invite?.expiresAt ?? null,
    },
  };
}

type BillingState = "active" | "suspended" | "canceled";

async function setState(id: string, state: BillingState): Promise<ProvisionResult> {
  const tenant = await findByOrder(id);
  if (!tenant) {
    return { status: 404, body: { ok: false, error: "not_found", message: "Orden sin tienda asociada" } };
  }
  const updated = await prisma.tenant.update({
    where: { id: tenant.id },
    data: {
      active: state === "active",
      billingStatus: state,
      billingUpdatedAt: new Date(),
    },
    include: { adminUsers: true },
  });
  return { status: 200, body: { ok: true, tenant: tenantView(updated) } };
}

export async function handleProvision(req: ProvisionRequest): Promise<ProvisionResult> {
  switch (req.action) {
    case "check": {
      const res = await checkTenantSlug(req.slug);
      return {
        status: 200,
        body: res.ok
          ? { ok: true, available: true, slug: res.slug, url: platformUrl("/", res.slug) }
          : { ok: true, available: false, slug: res.slug, reason: res.code, message: res.message },
      };
    }
    case "create":
      return create(req);
    case "sync": {
      const existing = await findByOrder(req.orderId);
      if (!existing) {
        // Only an active order (paid, hook missed) justifies creating the store.
        if (req.status !== "active") {
          return { status: 200, body: { ok: true, skipped: true, reason: "no_tenant" } };
        }
        return create({ ...req, action: "create" });
      }
      const wanted = req.status;
      if (existing.billingStatus === wanted && existing.active === (wanted === "active")) {
        return { status: 200, body: { ok: true, changed: false, tenant: tenantView(existing) } };
      }
      const res = await setState(req.orderId, wanted);
      return { ...res, body: { ...res.body, changed: true } };
    }
    case "suspend":
      return setState(req.orderId, "suspended");
    case "unsuspend":
      return setState(req.orderId, "active");
    case "cancel":
      return setState(req.orderId, "canceled");
    case "renew": {
      const tenant = await findByOrder(req.orderId);
      if (!tenant) {
        return { status: 404, body: { ok: false, error: "not_found", message: "Orden sin tienda asociada" } };
      }
      const updated = await prisma.tenant.update({
        where: { id: tenant.id },
        data: { billingUpdatedAt: new Date() },
        include: { adminUsers: true },
      });
      return { status: 200, body: { ok: true, tenant: tenantView(updated) } };
    }
    case "invite": {
      const tenant = await findByOrder(req.orderId);
      if (!tenant) {
        return { status: 404, body: { ok: false, error: "not_found", message: "Orden sin tienda asociada" } };
      }
      if (!tenant.active) {
        return { status: 409, body: { ok: false, error: "tenant_inactive", message: "La tienda está suspendida" } };
      }
      const owner = ownerOf(tenant);
      if (!owner) {
        return { status: 409, body: { ok: false, error: "no_admin", message: "La tienda no tiene administrador" } };
      }
      const invite = await createAdminInvite(owner.id, tenant.slug);
      return {
        status: 200,
        body: {
          ok: true,
          tenant: tenantView(tenant),
          inviteUrl: invite.url,
          inviteExpiresAt: invite.expiresAt,
          email: owner.email,
        },
      };
    }
  }
}
