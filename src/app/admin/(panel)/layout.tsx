import Link from "next/link";
import { redirect } from "next/navigation";
import { logoutAction } from "../actions";
import { Button } from "@/components/ui/button";
import { isSuperAdmin, requireAdmin } from "@/lib/auth";
import { adminThemeStyle } from "@/lib/branding";

export default async function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login");

  const superAdmin = isSuperAdmin(admin);
  const theme = adminThemeStyle();

  return (
    <div style={theme} className="min-h-screen bg-[#f7fbfd]">
      <header className="border-b border-[#d5e3ec] bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-5 py-4">
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
              </>
            ) : (
              <>
                <Link
                  href="/admin"
                  className="text-[var(--brand-deep)] hover:text-[var(--brand)] hover:underline"
                >
                  Resumen
                </Link>
                <Link
                  href="/admin/productos"
                  className="text-[var(--brand-deep)] hover:text-[var(--brand)] hover:underline"
                >
                  Productos
                </Link>
                <Link
                  href="/admin/pedidos"
                  className="text-[var(--brand-deep)] hover:text-[var(--brand)] hover:underline"
                >
                  Pedidos
                </Link>
                <Link
                  href="/admin/marca"
                  className="text-[var(--brand-deep)] hover:text-[var(--brand)] hover:underline"
                >
                  Marca
                </Link>
                <Link
                  href="/admin/modulos"
                  className="text-[var(--brand-deep)] hover:text-[var(--brand)] hover:underline"
                >
                  Módulos
                </Link>
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
      <main className="mx-auto max-w-5xl px-5 py-8">{children}</main>
    </div>
  );
}
