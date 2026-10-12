import Link from "next/link";
import { redirect } from "next/navigation";
import type { Discount } from "@prisma/client";
import { Pause, Pencil, Play, Plus, TicketPercent, Trash2 } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { discountBadge } from "@/lib/discounts";
import { todayCl } from "@/lib/dispatch";
import { deleteDiscountAction, toggleDiscountAction } from "./actions";
import {
  ConfirmSubmitButton,
  DataTable,
  EmptyState,
  PageHeader,
  Panel,
  StatusBadge,
  adminButton,
  type StatusTone,
} from "@/components/admin/ui";

function statusOf(d: Discount, now: Date): { label: string; tone: StatusTone } {
  if (!d.active) return { label: "Pausado", tone: "neutral" };
  if (d.endsAt && d.endsAt <= now) return { label: "Vencido", tone: "danger" };
  if (d.startsAt && d.startsAt > now) return { label: "Programado", tone: "info" };
  return { label: "Activo", tone: "success" };
}

function shortDate(d: Date) {
  const [y, m, day] = todayCl(d).split("-");
  return `${day}-${m}-${y}`;
}

function validity(d: Discount): string {
  const from = d.startsAt ? shortDate(d.startsAt) : null;
  const to = d.endsAt ? shortDate(new Date(d.endsAt.getTime() - 1)) : null;
  if (from && to) return `${from} al ${to}`;
  if (from) return `Desde ${from}`;
  if (to) return `Hasta ${to}`;
  return "Sin fecha de término";
}

export default async function AdminDiscountsPage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login");
  if (admin.role === "super_admin" && admin.tenant.slug === "plataforma") {
    redirect("/admin/plataforma");
  }

  const [discounts, productCount] = await Promise.all([
    prisma.discount.findMany({
      where: { tenantId: admin.tenantId },
      orderBy: [{ active: "desc" }, { createdAt: "desc" }],
    }),
    prisma.product.count({ where: { tenantId: admin.tenantId } }),
  ]);
  const now = new Date();

  return (
    <>
      <PageHeader
        title="Descuentos"
        description="Rebaja precios automáticamente o crea cupones para tus clientes. El carrito y el pago calculan el total con el descuento."
        breadcrumbs={[{ label: "Catálogo" }, { label: "Descuentos" }]}
        actions={
          <Link href="/admin/descuentos/nuevo" className={adminButton()}>
            <Plus aria-hidden />
            Nuevo descuento
          </Link>
        }
      />

      <Panel flush>
        <DataTable
          caption="Descuentos"
          rows={discounts}
          rowKey={(d) => d.id}
          mobileCards
          empty={
            <EmptyState
              icon={<TicketPercent />}
              title="Aún no hay descuentos"
              description={
                productCount === 0
                  ? "Primero agrega productos; luego crea un descuento para rebajar sus precios o un cupón."
                  : "Crea un descuento automático (precios rebajados en la tienda) o un cupón que tus clientes escriben en el carrito."
              }
              action={
                <Link href="/admin/descuentos/nuevo" className={adminButton()}>
                  <Plus aria-hidden />
                  Nuevo descuento
                </Link>
              }
            />
          }
          columns={[
            {
              key: "name",
              header: "Descuento",
              mobile: "title",
              cell: (d) => (
                <div className="flex items-center gap-3">
                  <span
                    aria-hidden
                    className="grid h-10 min-w-12 shrink-0 place-items-center rounded-lg bg-[color-mix(in_srgb,var(--brand)_12%,white)] px-2 text-xs font-bold text-[var(--brand-deep)]"
                  >
                    {discountBadge(d)}
                  </span>
                  <div className="min-w-0">
                    <Link
                      href={`/admin/descuentos/${d.id}`}
                      className="font-semibold text-[var(--brand-deep)] hover:underline"
                    >
                      {d.name}
                    </Link>
                    <p className="truncate text-xs text-[#6b7a8f]">
                      {d.scope === "products"
                        ? `${d.productIds.length} producto${d.productIds.length === 1 ? "" : "s"}`
                        : "Todos los productos"}
                      {d.bannerText || d.imageUrl ? " · con aviso en la tienda" : ""}
                    </p>
                  </div>
                </div>
              ),
            },
            {
              key: "mode",
              header: "Cómo se aplica",
              cell: (d) =>
                d.couponCode ? (
                  <span className="text-sm">
                    Cupón{" "}
                    <code className="rounded bg-[#f1f6f9] px-1.5 py-0.5 font-mono text-xs font-bold text-[#12233d]">
                      {d.couponCode}
                    </code>
                  </span>
                ) : (
                  <span className="text-sm">Automático</span>
                ),
            },
            {
              key: "validity",
              header: "Vigencia",
              hideOnMobile: true,
              cell: (d) => <span className="text-sm text-[#3d4a5c]">{validity(d)}</span>,
            },
            {
              key: "status",
              header: "Estado",
              cell: (d) => {
                const s = statusOf(d, now);
                return <StatusBadge tone={s.tone}>{s.label}</StatusBadge>;
              },
            },
            {
              key: "actions",
              header: <span className="sr-only">Acciones</span>,
              align: "right",
              mobile: "actions",
              cell: (d) => (
                <div className="flex flex-wrap justify-end gap-1.5">
                  <form action={toggleDiscountAction}>
                    <input type="hidden" name="id" value={d.id} />
                    <button
                      type="submit"
                      aria-label={d.active ? `Pausar ${d.name}` : `Activar ${d.name}`}
                      className={adminButton({ variant: "secondary", size: "sm" })}
                    >
                      {d.active ? <Pause aria-hidden /> : <Play aria-hidden />}
                      {d.active ? "Pausar" : "Activar"}
                    </button>
                  </form>
                  <Link
                    href={`/admin/descuentos/${d.id}`}
                    aria-label={`Editar ${d.name}`}
                    className={adminButton({ variant: "secondary", size: "sm" })}
                  >
                    <Pencil aria-hidden />
                    Editar
                  </Link>
                  <form action={deleteDiscountAction}>
                    <input type="hidden" name="id" value={d.id} />
                    <ConfirmSubmitButton
                      aria-label={`Eliminar ${d.name}`}
                      confirmTitle={`¿Eliminar «${d.name}»?`}
                      confirmText="Deja de aplicarse de inmediato. Los pedidos anteriores conservan el descuento que tuvieron. Si solo quieres detenerlo un tiempo, usa «Pausar»."
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
