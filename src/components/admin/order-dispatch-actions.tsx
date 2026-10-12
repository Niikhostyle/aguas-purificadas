import { CheckCircle2, Truck, XCircle } from "lucide-react";
import { markOrdersAction } from "@/app/admin/(panel)/despacho/actions";
import { btn, field } from "@/components/admin/dispatch-ui";
import { cn } from "@/lib/utils";
import { ConfirmSubmitButton } from "./ui/confirm-submit";

export function OrderDispatchActions({
  orderId,
  status,
  returnTo,
  bottlesExpected,
  size = "sm",
}: {
  orderId: string;
  status: string;
  returnTo: string;
  bottlesExpected: number;
  size?: "sm" | "lg";
}) {
  if (status === "entregado") return null;
  const big = size === "lg";
  return (
    <div className={cn("flex flex-wrap items-start gap-2 print:hidden", big && "w-full")}>
      {status !== "en_ruta" ? (
        <form action={markOrdersAction} className={cn(big && "flex-1")}>
          <input type="hidden" name="orderIds" value={orderId} />
          <input type="hidden" name="status" value="en_ruta" />
          <input type="hidden" name="returnTo" value={returnTo} />
          <button
            type="submit"
            className={cn(big ? `${btn.navy} w-full py-3 text-base` : btn.ghost, "ring-1 ring-[#d5e3ec]")}
          >
            <Truck className={big ? "size-5" : "size-3.5"} />
            En ruta
          </button>
        </form>
      ) : null}
      <details className={cn("group relative", big && "flex-1")}>
        <summary
          className={cn(
            "list-none [&::-webkit-details-marker]:hidden",
            big
              ? `${btn.success} w-full cursor-pointer py-3 text-base`
              : "inline-flex cursor-pointer items-center gap-1 rounded-md bg-emerald-600 px-2 py-1 text-xs font-semibold text-white hover:bg-emerald-700",
          )}
        >
          <CheckCircle2 className={big ? "size-5" : "size-3.5"} />
          Entregado
        </summary>
        <form
          action={markOrdersAction}
          className={cn(
            "z-20 mt-2 space-y-2 rounded-xl border border-[#d5e3ec] bg-white p-3 shadow-lg",
            big ? "w-full" : "absolute right-0 w-64",
          )}
        >
          <input type="hidden" name="orderIds" value={orderId} />
          <input type="hidden" name="returnTo" value={returnTo} />
          <label className="block text-xs font-medium text-[#5a6578]">
            Envases devueltos
            <input
              type="number"
              name="bottlesReturned"
              min={0}
              max={200}
              defaultValue={bottlesExpected}
              className={cn(field, "mt-1 w-full")}
            />
          </label>
          <label className="block text-xs font-medium text-[#5a6578]">
            Nota (opcional)
            <input
              name="note"
              maxLength={500}
              placeholder="Ej: recibió conserje"
              className={cn(field, "mt-1 w-full")}
            />
          </label>
          <div className="flex gap-2">
            <button type="submit" name="status" value="entregado" className={cn(btn.success, "flex-1 py-1.5 text-xs")}>
              <CheckCircle2 className="size-3.5" /> Confirmar
            </button>
            <ConfirmSubmitButton
              name="status"
              value="no_entregado"
              confirmTitle="¿Marcar como no entregado?"
              confirmText="El pedido vuelve a quedar pendiente para reprogramarlo. Puedes dejar una nota con el motivo."
              confirmLabel="Marcar no entregado"
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-rose-700 ring-1 ring-rose-200 hover:bg-rose-50 [&>svg]:size-3.5"
            >
              <XCircle className="size-3.5" /> No entregado
            </ConfirmSubmitButton>
          </div>
        </form>
      </details>
    </div>
  );
}
