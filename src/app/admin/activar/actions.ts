"use server";

import { hashSync } from "bcryptjs";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { consumeInvite, findValidInvite } from "@/lib/admin-invite";
import { setAdminSessionCookie } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

export type ActivateState = { error: string | null };

export async function activateAdminAction(
  _prev: ActivateState,
  formData: FormData,
): Promise<ActivateState> {
  const token = String(formData.get("token") || "");
  const password = String(formData.get("password") || "");
  const confirm = String(formData.get("confirm") || "");

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
  if (!rateLimit(`admin-activate:${ip}`, 10, 15 * 60_000).ok) {
    return { error: "Demasiados intentos. Prueba de nuevo en unos minutos." };
  }

  const invite = await findValidInvite(token);
  if (!invite || invite.adminUser.tenant.slug !== h.get("x-tenant-slug")) {
    return { error: "El enlace no es válido o ya expiró." };
  }

  if (password.length < 12) return { error: "La contraseña debe tener al menos 12 caracteres." };
  if (password.length > 200) return { error: "La contraseña es demasiado larga." };
  if (/admin123|password|changeme|123456789/i.test(password)) {
    return { error: "Elige una contraseña más segura." };
  }
  if (password !== confirm) return { error: "Las contraseñas no coinciden." };

  if (!(await consumeInvite(invite.id))) return { error: "El enlace ya fue utilizado." };

  const admin = await prisma.adminUser.update({
    where: { id: invite.adminUserId },
    data: { passwordHash: hashSync(password, 12) },
  });

  await setAdminSessionCookie(admin);
  redirect("/admin");
}
