import { redirect } from "next/navigation";
import { isSuperAdmin, requireAdmin } from "@/lib/auth";
import { parseModuleFlags, type ModuleFlags } from "@/lib/modules";

/**
 * Company (tenant) admin guard for pages and server actions.
 * Every query must be scoped with the returned `tenantId`.
 */
export async function requireTenantAdmin() {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login");
  if (isSuperAdmin(admin)) redirect("/admin/plataforma");
  const flags = parseModuleFlags(admin.tenant.modulesEnabled);
  return { admin, tenantId: admin.tenantId, flags };
}

export async function requireTenantModule(module: keyof ModuleFlags) {
  const ctx = await requireTenantAdmin();
  return { ...ctx, enabled: ctx.flags[module] };
}
