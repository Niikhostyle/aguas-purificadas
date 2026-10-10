import { addToCartAction } from "@/app/(storefront)/cart-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AddToCartForm({ productId }: { productId: string }) {
  return (
    <form action={addToCartAction} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="productId" value={productId} />
      <div className="space-y-1.5">
        <Label htmlFor="quantity" className="text-[#4a655f]">
          Cantidad
        </Label>
        <Input
          id="quantity"
          name="quantity"
          type="number"
          min={1}
          max={99}
          defaultValue={1}
          className="w-24 bg-white"
        />
      </div>
      <Button type="submit" className="h-9 px-5">
        Agregar al carrito
      </Button>
    </form>
  );
}
