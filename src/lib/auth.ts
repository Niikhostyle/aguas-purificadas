import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";
import { prisma } from "@/lib/db";
import { compareSync } from "bcryptjs";

const COOKIE_NAME = "aguas_admin_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

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

export async function loginAdmin(
  tenantSlug: string,
  email: string,
  password: string,
) {
  const generic = "Credenciales inválidas";
  const tenant = await prisma.tenant.findFirst({
    where: { slug: tenantSlug, active: true },
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

  const token = sign({
    adminId: admin.id,
    tenantId: tenant.id,
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
