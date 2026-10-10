import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { updateProductAction } from "../../../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
};

export default async function EditProductPage({ params, searchParams }: Props) {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login");

  const { id } = await params;
  const { error } = await searchParams;
  const product = await prisma.product.findFirst({
    where: { id, tenantId: admin.tenantId },
  });
  if (!product) notFound();

  return (
    <div className="max-w-xl">
      <Link
        href="/admin/productos"
        className="text-sm text-[var(--brand)] hover:underline"
      >
        ← Productos
      </Link>
      <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl text-[var(--brand-deep)]">
        Editar producto
      </h1>

      <form action={updateProductAction} className="mt-8 space-y-4">
        <input type="hidden" name="id" value={product.id} />
        <div className="space-y-2">
          <Label htmlFor="name">Nombre</Label>
          <Input
            id="name"
            name="name"
            required
            defaultValue={product.name}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="slug">Slug</Label>
          <Input id="slug" name="slug" defaultValue={product.slug} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="priceClp">Precio CLP</Label>
          <Input
            id="priceClp"
            name="priceClp"
            type="number"
            min={0}
            step={1}
            required
            defaultValue={product.priceClp}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Descripción</Label>
          <Textarea
            id="description"
            name="description"
            rows={4}
            defaultValue={product.description ?? ""}
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="active"
            defaultChecked={product.active}
            className="size-4 accent-[var(--brand)]"
          />
          Publicado en la tienda
        </label>
        {error ? (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}
        <Button type="submit">Guardar cambios</Button>
      </form>
    </div>
  );
}
