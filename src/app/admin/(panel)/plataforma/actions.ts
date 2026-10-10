"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSuperAdmin } from "@/lib/auth";
import { createTenantOnboarding } from "@/lib/onboarding";

export async function createTenantAction(formData: FormData) {
  const admin = await requireSuperAdmin();
  if (!admin) redirect("/admin/login?tenant=plataforma");

  try {
    const tenant = await createTenantOnboarding({
      slug: String(formData.get("slug") || ""),
      name: String(formData.get("name") || ""),
      tagline: String(formData.get("tagline") || "") || undefined,
      about: String(formData.get("about") || "") || undefined,
      primaryColor: String(formData.get("primaryColor") || "") || undefined,
      secondaryColor: String(formData.get("secondaryColor") || "") || undefined,
      phone: String(formData.get("phone") || "") || undefined,
      email: String(formData.get("email") || "") || undefined,
      city: String(formData.get("city") || "") || undefined,
      region: String(formData.get("region") || "") || undefined,
      adminName: String(formData.get("adminName") || ""),
      adminEmail: String(formData.get("adminEmail") || ""),
      adminPassword: String(formData.get("adminPassword") || ""),
      withSampleCatalog: formData.get("withSampleCatalog") === "on",
      withSandboxWebpay: formData.get("withSandboxWebpay") === "on",
    });

    revalidatePath("/admin/plataforma");
    redirect(`/?tenant=${tenant.slug}`);
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "No se pudo crear la empresa";
    // Next redirect throws; rethrow those
    if (
      typeof e === "object" &&
      e &&
      "digest" in e &&
      String((e as { digest?: string }).digest).startsWith("NEXT_REDIRECT")
    ) {
      throw e;
    }
    redirect(
      "/admin/plataforma/nueva?error=" + encodeURIComponent(message),
    );
  }
}
