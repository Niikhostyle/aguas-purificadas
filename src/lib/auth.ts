import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";
import { prisma } from "@/lib/db";
import { compareSync } from "bcryptjs";
import { getTenantSlugFromHeaders } from "@/lib/tenant";

const COOKIE_NAME = "aguas_admin_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

/** Public demo tenant — admin panel is open, no credentials. */
export const DEMO_TENANT_SLUG = "demo";

export function isDemoTenantSlug(slug: string | null | undefined): boolean {
  return (slug || "").trim().toLowerCase() === DEMO_TENANT_SLUG;
}

type SessionPayload = {
  adminId: string;
  tenantId: string;
  email: string;
  exp: number;
};

function getSecret() {
  return process.env.ADMIN_SESSION_SECRET || "dev-session-secret";
}

function sign(payload: SessionPayload): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", getSecret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

function verify(token: string): SessionPayload | null {
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = createHmac("sha256", getSecret()).update(body).digest("base64url");
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }
  try {
    const payload = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8"),
    ) as SessionPayload;
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

/** Call only from a Route Handler or Server Action (sets cookies). */
export async function setAdminSessionCookie(admin: {
  id: string;
  tenantId: string;
  email: string;
}) {
  const token = sign({
    adminId: admin.id,
    tenantId: admin.tenantId,
    email: admin.email,
    exp: Date.now() + MAX_AGE_SECONDS * 1000,
  });

  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

/**
 * Open the company admin panel for the public demo tenant without credentials.
 * Call only from a Route Handler or Server Action (sets cookies).
 */
export async function ensureDemoAdminSession(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const tenant = await prisma.tenant.findFirst({
    where: { slug: DEMO_TENANT_SLUG, active: true },
  });
  if (!tenant) {
    return { ok: false, error: "Demo no disponible" };
  }

  const admin = await prisma.adminUser.findFirst({
    where: {
      tenantId: tenant.id,
      role: { not: "super_admin" },
    },
    orderBy: { createdAt: "asc" },
  });
  if (!admin) {
    return { ok: false, error: "Demo no disponible" };
  }

  await setAdminSessionCookie(admin);
  return { ok: true };
}

export async function loginAdmin(
  tenantSlug: string,
  email: string,
  password: string,
) {
  const generic = "Credenciales inválidas";
  const slug = tenantSlug.trim().toLowerCase();

  // Public demo: no password / email required
  if (isDemoTenantSlug(slug)) {
    return ensureDemoAdminSession();
  }

  const tenant = await prisma.tenant.findFirst({
    where: { slug, active: true },
  });
  if (!tenant) return { ok: false as const, error: generic };

  const admin = await prisma.adminUser.findUnique({
    where: {
      tenantId_email: { tenantId: tenant.id, email: email.toLowerCase() },
    },
  });
  if (!admin || !compareSync(password, admin.passwordHash)) {
    return { ok: false as const, error: generic };
  }

  await setAdminSessionCookie(admin);
  return { ok: true as const, tenant };
}

export async function logoutAdmin() {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

export async function getAdminSession() {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = verify(token);
  if (!payload) return null;

  const admin = await prisma.adminUser.findUnique({
    where: { id: payload.adminId },
    include: { tenant: true },
  });
  if (!admin || admin.tenantId !== payload.tenantId) return null;
  if (!admin.tenant.active) return null;

  // Bind the session to the host: a tenant host only accepts its own admins, and
  // super-admin only works on the apex / plataforma host (no tenant slug resolved).
  const hostSlug = await getTenantSlugFromHeaders();
  if (hostSlug && hostSlug !== admin.tenant.slug) return null;
  if (admin.role === "super_admin" && hostSlug) return null;
  return admin;
}

export async function requireAdmin() {
  const admin = await getAdminSession();
  if (!admin) return null;
  return admin;
}

export async function requireSuperAdmin() {
  const admin = await getAdminSession();
  if (!admin || admin.role !== "super_admin") return null;
  return admin;
}

export function isSuperAdmin(
  admin: { role: string } | null | undefined,
): boolean {
  return admin?.role === "super_admin";
}
