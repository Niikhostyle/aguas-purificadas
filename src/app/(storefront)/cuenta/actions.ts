"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import {
  loginCustomer,
  logoutCustomer,
  registerCustomer,
} from "@/lib/customer-auth";
import { rateLimit } from "@/lib/rate-limit";
import { requireTenant } from "@/lib/tenant";
import { parseModuleFlags } from "@/lib/modules";

async function ensureLoginModule() {
  const tenant = await requireTenant();
  const flags = parseModuleFlags(tenant.modulesEnabled);
  if (!flags.loginClientes) redirect("/");
  return tenant;
}

export async function customerRegisterAction(formData: FormData) {
  const tenant = await ensureLoginModule();
  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "unknown";
  const limited = rateLimit(`customer-reg:${ip}:${tenant.id}`, 5, 60_000);
  if (!limited.ok) {
    redirect("/cuenta?error=" + encodeURIComponent("Demasiados intentos"));
  }

  const result = await registerCustomer({
    tenantId: tenant.id,
    email: String(formData.get("email") || ""),
    password: String(formData.get("password") || ""),
    name: String(formData.get("name") || ""),
    phone: String(formData.get("phone") || "") || undefined,
  });
  if (!result.ok) {
    redirect("/cuenta?error=" + encodeURIComponent(result.error));
  }
  redirect("/cuenta?ok=1");
}

export async function customerLoginAction(formData: FormData) {
  const tenant = await ensureLoginModule();
  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "unknown";
  const limited = rateLimit(`customer-login:${ip}:${tenant.id}`, 8, 60_000);
  if (!limited.ok) {
    redirect("/cuenta?error=" + encodeURIComponent("Demasiados intentos"));
  }

  const result = await loginCustomer(
    tenant.id,
    String(formData.get("email") || ""),
    String(formData.get("password") || ""),
  );
  if (!result.ok) {
    redirect("/cuenta?error=" + encodeURIComponent(result.error));
  }
  redirect("/cuenta?ok=1");
}

export async function customerLogoutAction() {
  await logoutCustomer();
  redirect("/cuenta");
}
