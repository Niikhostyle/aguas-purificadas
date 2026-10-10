import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { logoutAction } from "../actions";
import { Button } from "@/components/ui/button";

export default async function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login");

  return (
    <div className="min-h-screen bg-[#f3f7f6]">
      <header className="border-b border-[#c5d8d2] bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-4">
          <div>
            <p className="font-[family-name:var(--font-display)] text-lg text-[var(--brand-deep)]">
              {admin.tenant.name}
            </p>
            <p className="text-xs text-[#4a655f]">
              Admin · {admin.email}
            </p>
          </div>
          <nav className="flex items-center gap-3 text-sm">
            <Link
              href="/admin"
              className="text-[var(--brand-deep)] hover:underline"
            >
              Resumen
            </Link>
            <Link
              href="/admin/productos"
              className="text-[var(--brand-deep)] hover:underline"
            >
              Productos
            </Link>
            <Link
              href="/admin/pedidos"
              className="text-[var(--brand-deep)] hover:underline"
            >
              Pedidos
            </Link>
            <Link href="/" className="text-[#4a655f] hover:underline">
              Ver tienda
            </Link>
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
