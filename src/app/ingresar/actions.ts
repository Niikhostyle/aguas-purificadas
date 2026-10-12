"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { normalizeTenantSlug } from "@/lib/onboarding";
import { platformUrl } from "@/lib/platform-url";

export async function goToTenantLoginAction(formData: FormData) {
  const raw = String(formData.get("store") || "").trim().toLowerCase();
  // Accept "mitienda", "mitienda.mibidon.cl" or a pasted URL.
  const host = raw.replace(/^https?:\/\//, "").split(/[/?#]/)[0] || "";
  const slug = normalizeTenantSlug(host.split(".")[0] || "");

  const tenant = slug
    ? await prisma.tenant.findUnique({ where: { slug }, select: { slug: true } })
    : null;
  if (!tenant || slug === "plataforma") {
    redirect(`/ingresar?error=${encodeURIComponent("No encontramos una tienda con ese subdominio")}`);
  }
  redirect(platformUrl("/admin/login", tenant.slug));
}
