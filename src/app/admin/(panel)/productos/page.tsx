import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatClp } from "@/lib/utils";
import { deleteProductAction } from "../../actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function AdminProductsPage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login");

  const products = await prisma.product.findMany({
    where: { tenantId: admin.tenantId },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--brand-deep)]">
            Productos
          </h1>
          <p className="mt-2 text-sm text-[#4a655f]">
            Listá y editá el catálogo del tenant. Los cambios se reflejan en la
            tienda.
          </p>
        </div>
        <Link
          href="/admin/productos/nuevo"
          className="inline-flex h-8 items-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/80"
        >
          Nuevo producto
        </Link>
      </div>

      {products.length === 0 ? (
        <p className="mt-10 rounded-lg border border-dashed border-[#b7cdc6] bg-white px-6 py-12 text-center text-[#4a655f]">
          No hay productos. Creá el primero o volvé a correr{" "}
          <code className="rounded bg-[#eef5f3] px-1">npm run db:seed</code>.
        </p>
      ) : (
        <div className="mt-8 overflow-hidden rounded-lg border border-[#c5d8d2] bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-xs text-[#4a655f]">{product.slug}</p>
                  </TableCell>
                  <TableCell>{formatClp(product.priceClp)}</TableCell>
                  <TableCell>
                    {product.active ? (
                      <Badge variant="secondary">Activo</Badge>
                    ) : (
                      <Badge variant="outline">Oculto</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/admin/productos/${product.id}`}
                        className="inline-flex h-7 items-center rounded-md border border-border bg-background px-2.5 text-[0.8rem] font-medium hover:bg-muted"
                      >
                        Editar
                      </Link>
                      <form action={deleteProductAction}>
                        <input type="hidden" name="id" value={product.id} />
                        <Button type="submit" variant="ghost" size="sm">
                          Eliminar
                        </Button>
                      </form>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
