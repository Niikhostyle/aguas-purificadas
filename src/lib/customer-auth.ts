import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";
import { compareSync, hashSync } from "bcryptjs";
import { prisma } from "@/lib/db";

const COOKIE_NAME = "aguas_customer_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 14;

type Payload = {
  customerId: string;
  tenantId: string;
  email: string;
  exp: number;
};

function getSecret() {
  return (
    process.env.CUSTOMER_SESSION_SECRET ||
    process.env.ADMIN_SESSION_SECRET ||
    "dev-customer-session-secret"
  );
}

function sign(payload: Payload): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", getSecret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

function verify(token: string): Payload | null {
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
    ) as Payload;
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function registerCustomer(input: {
  tenantId: string;
  email: string;
  password: string;
  name: string;
  phone?: string;
}) {
  const email = input.email.trim().toLowerCase();
  if (!email || input.password.length < 8) {
    return { ok: false as const, error: "Datos inválidos" };
  }
  const existing = await prisma.customer.findUnique({
    where: { tenantId_email: { tenantId: input.tenantId, email } },
  });
  if (existing) return { ok: false as const, error: "No se pudo crear la cuenta" };

  const customer = await prisma.customer.create({
    data: {
      tenantId: input.tenantId,
      email,
      passwordHash: hashSync(input.password, 12),
      name: input.name.trim().slice(0, 120),
      phone: input.phone?.trim() || null,
    },
  });

  await setCustomerSession(customer.id, customer.tenantId, customer.email);
  return { ok: true as const, customer };
}

export async function loginCustomer(
  tenantId: string,
  email: string,
  password: string,
) {
  const customer = await prisma.customer.findUnique({
    where: {
      tenantId_email: {
        tenantId,
        email: email.trim().toLowerCase(),
      },
    },
  });
  if (!customer || !compareSync(password, customer.passwordHash)) {
    return { ok: false as const, error: "Credenciales inválidas" };
  }
  await setCustomerSession(customer.id, customer.tenantId, customer.email);
  return { ok: true as const, customer };
}

async function setCustomerSession(
  customerId: string,
  tenantId: string,
  email: string,
) {
  const token = sign({
    customerId,
    tenantId,
    email,
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

export async function logoutCustomer() {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

export async function getCustomerSession(tenantId: string) {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = verify(token);
  if (!payload || payload.tenantId !== tenantId) return null;
  return prisma.customer.findFirst({
    where: { id: payload.customerId, tenantId },
  });
}
