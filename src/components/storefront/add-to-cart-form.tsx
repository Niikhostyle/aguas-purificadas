"use client";

import { Loader2, ShoppingBag, ShoppingCart } from "lucide-react";
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
  soldOut = false,
}: {
  productId: string;
  productName: string;
  fallbackAction: FallbackAction;
  soldOut?: boolean;
}) {
  const { state, onSubmit, pending } = useAddToCart();
  if (soldOut) {
    return (
      <button
        type="button"
        disabled
        aria-label={`${productName} sin stock`}
        className="flex min-h-11 w-full cursor-not-allowed items-center justify-center rounded-full bg-[#e3e9ef] px-4 text-xs font-bold uppercase tracking-wide text-[#7a8597]"
      >
        Sin stock
      </button>
    );
  }
  return (
    <form action={fallbackAction} onSubmit={onSubmit}>
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="quantity" value="1" />
      <button
        type="submit"
        disabled={pending}
        aria-busy={pending}
        aria-label={`Agregar ${productName} al carrito`}
        className="rc-btn-primary flex min-h-11 w-full items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wide disabled:opacity-70"
      >
        {pending ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : (
          <ShoppingCart className="size-4" aria-hidden />
        )}
        {pending ? "Agregando…" : "Agregar al carrito"}
      </button>
      {state && !state.ok ? (
        <p role="alert" className="mt-1.5 text-center text-xs text-red-700">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
