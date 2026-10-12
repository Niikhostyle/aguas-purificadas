import Link from "next/link";
import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { Package, Pencil, Plus, SearchX, Trash2 } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatClp } from "@/lib/utils";
import { deleteProductAction } from "../../actions";
import {
  ConfirmSubmitButton,
  DataTable,
  EmptyState,
  FilterBar,
  PageHeader,
  Pagination,
  Panel,
  StatusBadge,
  adminButton,
  paginate,
  parseSort,
} from "@/components/admin/ui";

const PAGE_SIZE = 25;
const SORTS = ["nombre", "precio", "stock"] as const;
const SORT_FIELD: Record<(typeof SORTS)[number], keyof Prisma.ProductOrderByWithRelationInput> = {
  nombre: "name",
  precio: "priceClp",
  stock: "stock",
};

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; estado?: string; page?: string; orden?: string }>;
}) {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login");

  const sp = await searchParams;
  const q = sp.q?.trim().slice(0, 80) ?? "";
  const estado = ["activos", "ocultos"].includes(sp.estado ?? "") ? sp.estado! : "all";
  const sorted = sp.orden ? parseSort(sp.orden, SORTS, "nombre") : null;

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
    orderBy: sorted
      ? [
          sorted.by === "stock"
            ? { stock: { sort: sorted.dir, nulls: "last" } }
            : { [SORT_FIELD[sorted.by]]: sorted.dir },
          { name: "asc" },
        ]
      : [{ sortOrder: "asc" }, { name: "asc" }],
    skip,
    take,
  });
  const filtered = Boolean(q) || estado !== "all";
  const params = { q, estado: estado === "all" ? undefined : estado, orden: sp.orden };
  const returnTo = `/admin/productos?${new URLSearchParams(
    Object.entries({ ...params, page: page > 1 ? String(page) : undefined }).filter(
      (e): e is [string, string] => Boolean(e[1]),
    ),
  )}`;

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
            hidden={sp.orden ? { orden: sp.orden } : undefined}
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
              params={params}
              noun="productos"
            />
          ) : undefined
        }
      >
        <DataTable
          caption="Productos"
          rows={products}
          rowKey={(p) => p.id}
          mobileCards
          sort={{
            by: sorted?.by ?? "",
            dir: sorted?.dir ?? "asc",
            basePath: "/admin/productos",
            params,
          }}
          empty={
            <EmptyState
              icon={filtered ? <SearchX /> : <Package />}
              title={filtered ? "Sin resultados" : "Aún no hay productos"}
              description={
                filtered
                  ? "No encontramos productos con estos filtros. Prueba con otra búsqueda."
                  : "Crea el primero para que aparezca en la tienda."
              }
              action={
                filtered ? (
                  <Link href="/admin/productos" className={adminButton({ variant: "secondary" })}>
                    Limpiar filtros
                  </Link>
                ) : (
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
              sortKey: "nombre",
              mobile: "title",
              cell: (p) => (
                <div className="flex items-center gap-3">
                  {p.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.imageUrl}
                      alt=""
                      loading="lazy"
                      className="size-10 shrink-0 rounded-lg border border-[#e8f0f5] bg-[#f7fbfd] object-contain"
                    />
                  ) : (
                    <span
                      aria-hidden
                      className="grid size-10 shrink-0 place-items-center rounded-lg bg-[color-mix(in_srgb,var(--brand)_10%,white)] text-[var(--brand)]"
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
                    <p className="truncate text-xs text-[#6b7a8f]">{p.slug}</p>
                  </div>
                </div>
              ),
            },
            {
              key: "price",
              header: "Precio",
              sortKey: "precio",
              align: "right",
              cell: (p) => <span className="tabular-nums">{formatClp(p.priceClp)}</span>,
            },
            {
              key: "stock",
              header: "Stock",
              sortKey: "stock",
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
              mobile: "actions",
              cell: (p) => (
                <div className="flex justify-end gap-1.5">
                  <Link
                    href={`/admin/productos/${p.id}`}
                    aria-label={`Editar ${p.name}`}
                    className={adminButton({ variant: "secondary", size: "sm" })}
                  >
                    <Pencil aria-hidden />
                    Editar
                  </Link>
                  <form action={deleteProductAction}>
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="returnTo" value={returnTo} />
                    <ConfirmSubmitButton
                      aria-label={`Eliminar ${p.name}`}
                      confirmTitle={`¿Eliminar «${p.name}»?`}
                      confirmText="El producto desaparece de la tienda. Los pedidos anteriores conservan su detalle. Si solo quieres ocultarlo, edítalo y desmarca «Publicado»."
                      confirmLabel="Sí, eliminar"
                      className={adminButton({ variant: "danger", size: "sm" })}
                    >
                      <Trash2 aria-hidden />
                      Eliminar
                    </ConfirmSubmitButton>
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
