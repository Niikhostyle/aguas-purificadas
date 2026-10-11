import { redirect } from "next/navigation";
import { isDemoTenantSlug, isSuperAdmin, requireAdmin } from "@/lib/auth";
import { parseModuleFlags, type ModuleFlags } from "@/lib/modules";
import { getTenantSlugFromHeaders } from "@/lib/tenant";

/**
 * Company (tenant) admin guard for pages and server actions.
 * Every query must be scoped with the returned `tenantId`.
 */
export async function requireTenantAdmin() {
  const admin = await requireAdmin();
  if (!admin) {
    const slug = await getTenantSlugFromHeaders();
    if (isDemoTenantSlug(slug)) redirect("/admin/demo-access");
    redirect("/admin/login");
  }
  if (isSuperAdmin(admin)) redirect("/admin/plataforma");
  const flags = parseModuleFlags(admin.tenant.modulesEnabled);
  return { admin, tenantId: admin.tenantId, flags };
}

export async function requireTenantModule(module: keyof ModuleFlags) {
  const ctx = await requireTenantAdmin();
  return { ...ctx, enabled: ctx.flags[module] };
}
