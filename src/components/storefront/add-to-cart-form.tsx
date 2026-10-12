import { ShoppingBag } from "lucide-react";
import { addToCartAction } from "@/app/(storefront)/cart-actions";
import { SubmitButton } from "@/components/storefront/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AddToCartForm({ productId }: { productId: string }) {
  return (
    <form action={addToCartAction} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="productId" value={productId} />
      <div className="space-y-1.5">
        <Label htmlFor="quantity" className="text-[#5a6578]">
          Cantidad
        </Label>
        <Input
          id="quantity"
          name="quantity"
          type="number"
          min={1}
          max={99}
          defaultValue={1}
          className="h-11 w-24 rounded-full bg-white px-4 text-center text-base font-semibold"
        />
      </div>
      <SubmitButton
        className="h-11 gap-2 px-6 text-sm font-bold uppercase tracking-wide"
        icon={<ShoppingBag className="size-4" aria-hidden />}
      >
        Agregar al carrito
      </SubmitButton>
    </form>
  );
}
