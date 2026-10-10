import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function PlatformAdminPage() {
  const admin = await requireSuperAdmin();
  if (!admin) redirect("/admin/login?tenant=plataforma");

  const tenants = await prisma.tenant.findMany({
    where: { slug: { not: "plataforma" } },
    include: {
      _count: {
        select: { products: true, orders: true, adminUsers: true },
      },
      webpayCredential: true,
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--brand-deep)]">
            Plataforma
          </h1>
          <p className="mt-2 text-sm text-[#5a6578]">
            Alta y supervisión de empresas (tenants). No opera el día a día del
            negocio del cliente.
          </p>
        </div>
        <Link
          href="/admin/plataforma/nueva"
          className="inline-flex h-8 items-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/80"
        >
          Nueva empresa
        </Link>
      </div>

      <div className="mt-8 overflow-hidden rounded-lg border border-[#d5e3ec] bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Empresa</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Productos</TableHead>
              <TableHead>Pedidos</TableHead>
              <TableHead>WebPay</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Tienda</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tenants.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="font-medium">{t.name}</TableCell>
                <TableCell className="font-mono text-xs">{t.slug}</TableCell>
                <TableCell>{t._count.products}</TableCell>
                <TableCell>{t._count.orders}</TableCell>
                <TableCell className="text-xs text-[#5a6578]">
                  {t.webpayCredential?.active
                    ? t.webpayCredential.environment
                    : "—"}
                </TableCell>
                <TableCell>
                  <Badge variant={t.active ? "secondary" : "outline"}>
                    {t.active ? "Activa" : "Suspendida"}
                  </Badge>
                </TableCell>
                <TableCell className="space-x-3 text-right">
                  <Link
                    href={`/admin/plataforma/${t.id}`}
                    className="text-sm text-[var(--brand)] hover:underline"
                  >
                    Gestionar
                  </Link>
                  <Link
                    href={`/?tenant=${t.slug}`}
                    className="text-sm text-[#5a6578] hover:underline"
                  >
                    Tienda
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
