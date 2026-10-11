import Link from "next/link";
import { redirect } from "next/navigation";
import { logoutAction } from "../actions";
import { Button } from "@/components/ui/button";
import { isSuperAdmin, requireAdmin } from "@/lib/auth";
import { adminThemeStyle } from "@/lib/branding";
import { parseModuleFlags } from "@/lib/modules";

export default async function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login");

  const superAdmin = isSuperAdmin(admin);
  const theme = adminThemeStyle();
  const flags = parseModuleFlags(admin.tenant.modulesEnabled);
  const tenantNav = [
    { href: "/admin", label: "Resumen", show: true },
    { href: "/admin/despacho", label: "Despacho", show: flags.despacho },
    { href: "/admin/pedidos", label: "Pedidos", show: true },
    { href: "/admin/recordatorios", label: "Recordatorios", show: flags.recordatorios },
    { href: "/admin/envases", label: "Envases", show: flags.envases },
    { href: "/admin/productos", label: "Productos", show: true },
    { href: "/admin/marca", label: "Marca", show: true },
    { href: "/admin/modulos", label: "Módulos", show: true },
  ].filter((item) => item.show);

  return (
    <div
      style={theme}
      className={`min-h-screen print:bg-white ${
        superAdmin
          ? "bg-[linear-gradient(180deg,#e8f7fc_0%,#f7fbfd_28%,#f7fbfd_100%)]"
          : "bg-[#f7fbfd]"
      }`}
    >
      <header className="border-b border-[#d5e3ec] bg-white/95 backdrop-blur print:hidden">
        <div
          className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-4"
        >
          <div>
            <p className="font-[family-name:var(--font-display)] text-lg text-[var(--brand-deep)]">
              {admin.tenant.name}
            </p>
            <p className="text-xs text-[#5a6578]">
              {superAdmin ? "MiBidón · super-admin" : "Admin empresa"} ·{" "}
              {admin.email}
            </p>
          </div>
          <nav className="flex flex-wrap items-center gap-3 text-sm">
            {superAdmin ? (
              <>
                <Link
                  href="/admin/plataforma"
                  className="text-[var(--brand-deep)] hover:text-[var(--brand)] hover:underline"
                >
                  Empresas
                </Link>
                <Link
                  href="/admin/plataforma/nueva"
                  className="text-[var(--brand-deep)] hover:text-[var(--brand)] hover:underline"
                >
                  Nueva
                </Link>
                <Link
                  href="/admin/plataforma/landing"
                  className="text-[var(--brand-deep)] hover:text-[var(--brand)] hover:underline"
                >
                  Landing
                </Link>
              </>
            ) : (
              <>
                {tenantNav.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="text-[var(--brand-deep)] hover:text-[var(--brand)] hover:underline"
                  >
                    {item.label}
                  </Link>
                ))}
                <Link
                  href="/"
                  className="text-[#5a6578] hover:text-[var(--brand)] hover:underline"
                >
                  Ver tienda
                </Link>
              </>
            )}
            <form action={logoutAction}>
              <Button type="submit" variant="outline" size="sm">
                Salir
              </Button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-8 print:max-w-none print:p-0">
        {children}
      </main>
    </div>
  );
}
