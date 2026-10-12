import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createProductAction } from "../../../actions";
import { PageHeader, Panel } from "@/components/admin/ui";
import { ProductForm } from "@/components/admin/product-form";

export default async function NewProductPage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login");

  return (
    <>
      <PageHeader
        title="Nuevo producto"
        description="Completa los datos y arrastra una imagen; aparecerá en la tienda al guardarlo publicado."
        breadcrumbs={[{ label: "Catálogo" }, { label: "Productos", href: "/admin/productos" }, { label: "Nuevo" }]}
      />
      <Panel className="max-w-3xl">
        <ProductForm action={createProductAction} />
      </Panel>
    </>
  );
}
