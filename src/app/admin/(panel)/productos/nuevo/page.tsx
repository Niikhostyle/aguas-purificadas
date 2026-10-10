import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createProductAction } from "../../../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default async function NewProductPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login");
  const { error } = await searchParams;

  return (
    <div className="max-w-xl">
      <Link
        href="/admin/productos"
        className="text-sm text-[var(--brand)] hover:underline"
      >
        ← Productos
      </Link>
      <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl text-[var(--brand-deep)]">
        Nuevo producto
      </h1>

      <form action={createProductAction} className="mt-8 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nombre</Label>
          <Input id="name" name="name" required placeholder="Bidón 20 L" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="slug">Slug (opcional)</Label>
          <Input id="slug" name="slug" placeholder="bidon-20l" />
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
            placeholder="3500"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Descripción</Label>
          <Textarea id="description" name="description" rows={4} />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="active"
            defaultChecked
            className="size-4 accent-[var(--brand)]"
          />
          Publicado en la tienda
        </label>
        {error ? (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}
        <Button type="submit">Crear producto</Button>
      </form>
    </div>
  );
}
