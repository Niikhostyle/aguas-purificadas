import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { saveDiscountAction } from "../actions";
import { PageHeader, Panel } from "@/components/admin/ui";
import { DiscountForm } from "@/components/admin/discount-form";

export default async function NewDiscountPage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login");
  if (admin.role === "super_admin" && admin.tenant.slug === "plataforma") {
    redirect("/admin/plataforma");
  }

  const products = await prisma.product.findMany({
    where: { tenantId: admin.tenantId },
    select: { id: true, name: true, priceClp: true, active: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return (
    <>
      <PageHeader
        title="Nuevo descuento"
        breadcrumbs={[{ label: "Catálogo" }, { label: "Descuentos", href: "/admin/descuentos" }, { label: "Nuevo" }]}
      />
      <Panel className="max-w-3xl">
        <DiscountForm action={saveDiscountAction} products={products} />
      </Panel>
    </>
  );
}
