import { notFound, redirect } from "next/navigation";
import { Trash2 } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { deleteProductAction, updateProductAction } from "../../../actions";
import { ConfirmSubmitButton, PageHeader, Panel, adminButton } from "@/components/admin/ui";
import { ProductForm } from "@/components/admin/product-form";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditProductPage({ params }: Props) {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login");

  const { id } = await params;
  const product = await prisma.product.findFirst({
    where: { id, tenantId: admin.tenantId },
  });
  if (!product) notFound();

  return (
    <>
      <PageHeader
        title="Editar producto"
        description={product.name}
        breadcrumbs={[{ label: "Catálogo" }, { label: "Productos", href: "/admin/productos" }, { label: "Editar" }]}
        actions={
          <form action={deleteProductAction}>
            <input type="hidden" name="id" value={product.id} />
            <ConfirmSubmitButton
              confirmTitle={`¿Eliminar «${product.name}»?`}
              confirmText="El producto desaparece de la tienda. Los pedidos anteriores conservan su detalle."
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
        <ProductForm
          action={updateProductAction}
          product={{
            id: product.id,
            name: product.name,
            slug: product.slug,
            priceClp: product.priceClp,
            description: product.description,
            imageUrl: product.imageUrl,
            active: product.active,
          }}
        />
      </Panel>
    </>
  );
}
