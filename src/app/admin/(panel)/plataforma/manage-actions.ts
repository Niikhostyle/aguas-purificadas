"use server";

import { hashSync } from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSuperAdmin } from "@/lib/auth";
import { isValidHexColor } from "@/lib/branding";
import { prisma } from "@/lib/db";

function rethrowRedirect(e: unknown) {
  if (
    typeof e === "object" &&
    e &&
    "digest" in e &&
    String((e as { digest?: string }).digest).startsWith("NEXT_REDIRECT")
  ) {
    throw e;
  }
}

export async function updateCompanyAction(formData: FormData) {
  const admin = await requireSuperAdmin();
  if (!admin) redirect("/admin/login?tenant=plataforma");

  const tenantId = String(formData.get("tenantId") || "");
  const name = String(formData.get("name") || "").trim();
  const slug = String(formData.get("slug") || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-");
  const tagline = String(formData.get("tagline") || "").trim();
  const about = String(formData.get("about") || "").trim();
  const primaryColor = String(formData.get("primaryColor") || "").trim();
  const secondaryColor = String(formData.get("secondaryColor") || "").trim();
  const active = formData.get("active") === "on";

  if (!tenantId || name.length < 2 || slug.length < 2) {
    redirect(
      `/admin/plataforma/${tenantId}?error=` +
        encodeURIComponent("Nombre y slug son obligatorios"),
    );
  }
  if (slug === "plataforma") {
    redirect(
      `/admin/plataforma/${tenantId}?error=` +
        encodeURIComponent("Slug reservado"),
    );
  }

  const clash = await prisma.tenant.findFirst({
    where: { slug, NOT: { id: tenantId } },
  });
  if (clash) {
    redirect(
      `/admin/plataforma/${tenantId}?error=` +
        encodeURIComponent("Ese slug ya está en uso"),
    );
  }

  await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      name,
      slug,
      tagline: tagline || null,
      about: about || null,
      primaryColor: isValidHexColor(primaryColor) ? primaryColor : undefined,
      secondaryColor: isValidHexColor(secondaryColor)
        ? secondaryColor
        : undefined,
      active,
    },
  });

  revalidatePath("/admin/plataforma");
  revalidatePath(`/admin/plataforma/${tenantId}`);
  redirect(`/admin/plataforma/${tenantId}?ok=1`);
}

export async function resetAdminPasswordAction(formData: FormData) {
  const admin = await requireSuperAdmin();
  if (!admin) redirect("/admin/login?tenant=plataforma");

  const adminId = String(formData.get("adminId") || "");
  const tenantId = String(formData.get("tenantId") || "");
  const password = String(formData.get("password") || "");
  if (!adminId || password.length < 6) {
    redirect(
      `/admin/plataforma/${tenantId}?error=` +
        encodeURIComponent("Clave mínimo 6 caracteres"),
    );
  }

  const target = await prisma.adminUser.findFirst({
    where: { id: adminId, tenantId },
  });
  if (!target) {
    redirect(
      `/admin/plataforma/${tenantId}?error=` +
        encodeURIComponent("Admin no encontrado"),
    );
  }

  await prisma.adminUser.update({
    where: { id: adminId },
    data: { passwordHash: hashSync(password, 10) },
  });

  revalidatePath(`/admin/plataforma/${tenantId}`);
  redirect(
    `/admin/plataforma/${tenantId}?ok=` +
      encodeURIComponent(`Clave actualizada para ${target.email}`),
  );
}

export async function createCompanyAdminAction(formData: FormData) {
  const admin = await requireSuperAdmin();
  if (!admin) redirect("/admin/login?tenant=plataforma");

  const tenantId = String(formData.get("tenantId") || "");
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") || "");

  try {
    if (!tenantId || name.length < 2 || !email || password.length < 6) {
      throw new Error("Completá nombre, email y clave (mín. 6)");
    }
    await prisma.adminUser.create({
      data: {
        tenantId,
        name,
        email,
        passwordHash: hashSync(password, 10),
        role: "admin",
      },
    });
  } catch (e) {
    rethrowRedirect(e);
    redirect(
      `/admin/plataforma/${tenantId}?error=` +
        encodeURIComponent(
          e instanceof Error ? e.message : "No se pudo crear el admin",
        ),
    );
  }

  revalidatePath(`/admin/plataforma/${tenantId}`);
  redirect(
    `/admin/plataforma/${tenantId}?ok=` +
      encodeURIComponent(`Admin ${email} creado`),
  );
}
