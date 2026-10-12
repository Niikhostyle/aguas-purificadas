import { notFound, redirect } from "next/navigation";
import { Trash2 } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { todayCl } from "@/lib/dispatch";
import { deleteDiscountAction, saveDiscountAction } from "../actions";
import { ConfirmSubmitButton, PageHeader, Panel, adminButton } from "@/components/admin/ui";
import { DiscountForm } from "@/components/admin/discount-form";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditDiscountPage({ params }: Props) {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login");
  if (admin.role === "super_admin" && admin.tenant.slug === "plataforma") {
    redirect("/admin/plataforma");
  }

  const { id } = await params;
  const [discount, products] = await Promise.all([
    prisma.discount.findFirst({ where: { id, tenantId: admin.tenantId } }),
    prisma.product.findMany({
      where: { tenantId: admin.tenantId },
      select: { id: true, name: true, priceClp: true, active: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
  ]);
  if (!discount) notFound();

  return (
    <>
      <PageHeader
        title="Editar descuento"
        description={discount.name}
        breadcrumbs={[{ label: "Catálogo" }, { label: "Descuentos", href: "/admin/descuentos" }, { label: "Editar" }]}
        actions={
          <form action={deleteDiscountAction}>
            <input type="hidden" name="id" value={discount.id} />
            <ConfirmSubmitButton
              confirmTitle={`¿Eliminar «${discount.name}»?`}
              confirmText="Deja de aplicarse de inmediato. Los pedidos anteriores conservan el descuento que tuvieron."
              confirmLabel="Sí, eliminar"
              className={adminButton({ variant: "danger" })}
            >
              <Trash2 aria-hidden />
              Eliminar
            </ConfirmSubmitButton>
          </form>
        }
      />
      <Panel className="max-w-3xl">
        <DiscountForm
          action={saveDiscountAction}
          products={products}
          discount={{
            id: discount.id,
            name: discount.name,
            type: discount.type,
            value: discount.value,
            scope: discount.scope,
            productIds: discount.productIds,
            couponCode: discount.couponCode,
            active: discount.active,
            startsAt: discount.startsAt ? todayCl(discount.startsAt) : null,
            endsAt: discount.endsAt ? todayCl(new Date(discount.endsAt.getTime() - 1)) : null,
            bannerText: discount.bannerText,
            imageUrl: discount.imageUrl,
          }}
        />
      </Panel>
    </>
  );
}
