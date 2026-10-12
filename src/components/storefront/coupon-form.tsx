import { Tag, X } from "lucide-react";
import { applyCouponAction, removeCouponAction } from "@/app/(storefront)/cart-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ResolvedCoupon } from "@/lib/cart";
import { formatClp } from "@/lib/utils";

export function CouponForm({
  applied,
  invalidStored,
  status,
  attemptedCode,
}: {
  applied: ResolvedCoupon | null;
  invalidStored: string | null;
  status?: string;
  attemptedCode?: string;
}) {
  if (applied) {
    return (
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm">
        <p className="flex items-center gap-2 text-emerald-800">
          <Tag aria-hidden className="size-4" />
          <span>
            Cupón <strong>{applied.code}</strong> ({applied.name}, {applied.badge})
            {applied.discountClp > 0
              ? ` · −${formatClp(applied.discountClp)}`
              : " · no aplica a los productos de tu carrito"}
          </span>
        </p>
        <form action={removeCouponAction}>
          <Button type="submit" variant="ghost" size="sm">
            <X aria-hidden />
            Quitar cupón
          </Button>
        </form>
      </div>
    );
  }

  const error =
    status === "invalido"
      ? `El cupón ${attemptedCode ? `«${attemptedCode}» ` : ""}no existe o ya no está vigente.`
      : status === "vacio"
        ? "Escribe un código de descuento."
        : invalidStored
          ? `El cupón «${invalidStored}» ya no está vigente y no se aplicó.`
          : null;

  return (
    <form action={applyCouponAction} className="mt-6 max-w-md">
      <label htmlFor="coupon" className="text-sm font-medium text-[var(--brand-deep)]">
        ¿Tienes un código de descuento?
      </label>
      <div className="mt-1.5 flex gap-2">
        <Input
          id="coupon"
          name="coupon"
          maxLength={40}
          autoComplete="off"
          placeholder="Ej: BIENVENIDA"
          defaultValue={status === "invalido" ? attemptedCode : undefined}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "coupon-error" : undefined}
          className="bg-white uppercase"
        />
        <Button type="submit" variant="outline">
          Aplicar
        </Button>
      </div>
      {error ? (
        <p id="coupon-error" role="alert" className="mt-1.5 text-xs font-medium text-red-700">
          {error}
        </p>
      ) : null}
    </form>
  );
}
