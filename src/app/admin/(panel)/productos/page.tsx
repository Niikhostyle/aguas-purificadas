import Link from "next/link";
import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { Package, Plus } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatClp } from "@/lib/utils";
import { deleteProductAction } from "../../actions";
import {
  DataTable,
  EmptyState,
  FilterBar,
  PageHeader,
  Pagination,
  Panel,
  StatusBadge,
  adminButton,
  paginate,
} from "@/components/admin/ui";

const PAGE_SIZE = 25;

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; estado?: string; page?: string }>;
}) {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login");

  const sp = await searchParams;
  const q = sp.q?.trim().slice(0, 80) ?? "";
  const estado = ["activos", "ocultos"].includes(sp.estado ?? "") ? sp.estado! : "all";

  const where: Prisma.ProductWhereInput = {
    tenantId: admin.tenantId,
    ...(estado === "activos" ? { active: true } : estado === "ocultos" ? { active: false } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { slug: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const total = await prisma.product.count({ where });
  const { page, pages, skip, take } = paginate(sp.page, total, PAGE_SIZE);
  const products = await prisma.product.findMany({
    where,
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    skip,
    take,
  });
  const filtered = Boolean(q) || estado !== "all";

  return (
    <>
      <PageHeader
        title="Productos"
        description="Catálogo de la tienda. Los cambios se reflejan de inmediato en el sitio."
        breadcrumbs={[{ label: "Catálogo" }, { label: "Productos" }]}
        actions={
          <Link href="/admin/productos/nuevo" className={adminButton()}>
            <Plus aria-hidden />
            Nuevo producto
          </Link>
        }
      />

      <Panel
        flush
        toolbar={
          <FilterBar
            q={q}
            searchPlaceholder="Nombre o slug…"
            selects={[
              {
                name: "estado",
                label: "Estado",
                value: estado,
                options: [
                  { value: "all", label: "Todos" },
                  { value: "activos", label: "Activos" },
                  { value: "ocultos", label: "Ocultos" },
                ],
              },
            ]}
          />
        }
        footer={
          total > 0 ? (
            <Pagination
              page={page}
              pages={pages}
              total={total}
              pageSize={PAGE_SIZE}
              basePath="/admin/productos"
              params={{ q, estado: estado === "all" ? undefined : estado }}
              noun="productos"
            />
          ) : undefined
        }
      >
        <DataTable
          caption="Productos"
          rows={products}
          rowKey={(p) => p.id}
          empty={
            <EmptyState
              icon={<Package />}
              title={filtered ? "Sin resultados" : "Aún no hay productos"}
              description={filtered ? "Prueba con otros filtros." : "Crea el primero para que aparezca en la tienda."}
              action={
                filtered ? undefined : (
                  <Link href="/admin/productos/nuevo" className={adminButton()}>
                    <Plus aria-hidden />
                    Nuevo producto
                  </Link>
                )
              }
            />
          }
          columns={[
            {
              key: "name",
              header: "Producto",
              cell: (p) => (
                <div className="flex items-center gap-3">
                  {p.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.imageUrl}
                      alt=""
                      className="size-10 shrink-0 rounded-lg border border-[#e8f0f5] bg-[#f7fbfd] object-contain"
                    />
                  ) : (
                    <span
                      aria-hidden
                      className="grid size-10 shrink-0 place-items-center rounded-lg bg-[#e8f7fc] text-[var(--brand)]"
                    >
                      <Package className="size-4" />
                    </span>
                  )}
                  <div className="min-w-0">
                    <Link
                      href={`/admin/productos/${p.id}`}
                      className="font-semibold text-[var(--brand-deep)] hover:underline"
                    >
                      {p.name}
                    </Link>
                    <p className="text-xs text-[#6b7a8f]">{p.slug}</p>
                  </div>
                </div>
              ),
            },
            { key: "price", header: "Precio", align: "right", cell: (p) => formatClp(p.priceClp) },
            {
              key: "stock",
              header: "Stock",
              align: "right",
              hideOnMobile: true,
              cell: (p) => (p.stock == null ? <span className="text-[#8a96a6]">—</span> : p.stock),
            },
            {
              key: "status",
              header: "Estado",
              cell: (p) =>
                p.active ? <StatusBadge tone="success">Activo</StatusBadge> : <StatusBadge tone="neutral">Oculto</StatusBadge>,
            },
            {
              key: "actions",
              header: <span className="sr-only">Acciones</span>,
              align: "right",
              cell: (p) => (
                <div className="flex justify-end gap-1.5">
                  <Link href={`/admin/productos/${p.id}`} className={adminButton({ variant: "secondary", size: "sm" })}>
                    Editar
                  </Link>
                  <form action={deleteProductAction}>
                    <input type="hidden" name="id" value={p.id} />
                    <button
                      type="submit"
                      aria-label={`Eliminar ${p.name}`}
                      className={adminButton({ variant: "danger", size: "sm" })}
                    >
                      Eliminar
                    </button>
                  </form>
                </div>
              ),
            },
          ]}
        />
      </Panel>
    </>
  );
}
