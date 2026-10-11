import { cookies } from "next/headers";
import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { compareSync, hashSync } from "bcryptjs";
import { DEMO_TENANT_SLUG } from "@/lib/auth";
import { prisma } from "@/lib/db";

const COOKIE_NAME = "aguas_customer_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 14;

/** Stable demo storefront customer — login is credential-free via demo-access. */
const DEMO_CUSTOMER_EMAIL = "cliente@demo.mibidon.cl";
const DEMO_CUSTOMER_NAME = "Cliente Demo";

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

/**
 * Open the customer area for the public demo tenant without credentials.
 * Call only from a Route Handler or Server Action (sets cookies).
 * Always targets tenant slug `demo` — never other paying tenants.
 */
export async function ensureDemoCustomerSession(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const tenant = await prisma.tenant.findFirst({
    where: { slug: DEMO_TENANT_SLUG, active: true },
  });
  if (!tenant) {
    return { ok: false, error: "Demo no disponible" };
  }

  let customer = await prisma.customer.findUnique({
    where: {
      tenantId_email: {
        tenantId: tenant.id,
        email: DEMO_CUSTOMER_EMAIL,
      },
    },
  });

  if (!customer) {
    customer = await prisma.customer.create({
      data: {
        tenantId: tenant.id,
        email: DEMO_CUSTOMER_EMAIL,
        name: DEMO_CUSTOMER_NAME,
        // Unusable random secret — entry is only via ensureDemoCustomerSession.
        passwordHash: hashSync(randomBytes(32).toString("hex"), 12),
      },
    });
  }

  await setCustomerSession(customer.id, customer.tenantId, customer.email);
  return { ok: true };
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
