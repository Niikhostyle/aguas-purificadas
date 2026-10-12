"use client";

import { Loader2, ShoppingBag } from "lucide-react";
import { useState, useTransition, type FormEvent } from "react";
import { addToCartInlineAction, type AddToCartState } from "@/app/(storefront)/cart-actions";
import { useCart } from "@/components/storefront/cart-drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type FallbackAction = (formData: FormData) => Promise<void>;

/**
 * `fallbackAction` must come from a Server Component: the form posts to it (and lands on /carrito)
 * when JS is unavailable. With JS the submit is intercepted, the line is added inline and the drawer opens.
 */
function useAddToCart() {
  const { openCart } = useCart();
  const [state, setState] = useState<AddToCartState>(null);
  const [pending, startTransition] = useTransition();
  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const next = await addToCartInlineAction(formData);
      setState(next);
      if (next?.ok) openCart({ cart: next.cart, added: next.productName });
    });
  };
  return { state, onSubmit, pending };
}

export function AddToCartForm({ productId, fallbackAction }: { productId: string; fallbackAction: FallbackAction }) {
  const { state, onSubmit, pending } = useAddToCart();
  return (
    <form action={fallbackAction} onSubmit={onSubmit} className="flex flex-wrap items-end gap-3">
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
      <Button
        type="submit"
        disabled={pending}
        aria-busy={pending}
        className="h-11 gap-2 px-6 text-sm font-bold uppercase tracking-wide"
      >
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <ShoppingBag className="size-4" aria-hidden />}
        Agregar al carrito
      </Button>
      {state && !state.ok ? (
        <p role="alert" className="w-full text-sm text-red-700">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}

export function QuickAddButton({
  productId,
  productName,
  fallbackAction,
}: {
  productId: string;
  productName: string;
  fallbackAction: FallbackAction;
}) {
  const { state, onSubmit, pending } = useAddToCart();
  return (
    <form action={fallbackAction} onSubmit={onSubmit}>
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="quantity" value="1" />
      <button
        type="submit"
        disabled={pending}
        aria-busy={pending}
        aria-label={`Agregar ${productName} al carrito`}
        title={state && !state.ok ? state.error : undefined}
        className="rc-btn-primary flex w-full items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold uppercase tracking-wide disabled:opacity-70"
      >
        {pending ? (
          <Loader2 className="size-3.5 animate-spin" aria-hidden />
        ) : (
          <ShoppingBag className="size-3.5" aria-hidden />
        )}
        Agregar
      </button>
    </form>
  );
}
