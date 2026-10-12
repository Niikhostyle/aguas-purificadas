"use client";

import Link from "next/link";
import { startTransition, useActionState, useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";
import type { DiscountFormState } from "@/app/admin/(panel)/descuentos/actions";
import { toast } from "@/lib/alerts";
import { formatClp } from "@/lib/utils";
import { adminButton } from "./ui/button-styles";
import { ImageDropzone } from "./ui/image-dropzone";

export type DiscountFormValues = {
  id: string;
  name: string;
  type: string;
  value: number;
  scope: string;
  productIds: string[];
  couponCode: string | null;
  active: boolean;
  startsAt: string | null;
  endsAt: string | null;
  bannerText: string | null;
  imageUrl: string | null;
};

type FieldKey = keyof NonNullable<DiscountFormState["fieldErrors"]>;

const inputCls = (invalid: boolean) =>
  `h-10 w-full rounded-lg border bg-white px-3 text-sm text-[#12233d] outline-none transition-colors placeholder:text-[#8a96a6] focus:ring-3 ${
    invalid
      ? "border-rose-300 focus:border-rose-400 focus:ring-rose-200/60"
      : "border-[#d5e3ec] focus:border-[var(--brand)] focus:ring-[var(--brand)]/20"
  }`;

function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium text-[#12233d]">
        {label}
      </label>
      <div className="mt-1.5">{children}</div>
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-xs font-medium text-rose-700">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-[#5a6578]">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

function Choice({
  name,
  value,
  checked,
  onChange,
  title,
  description,
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange: (v: string) => void;
  title: string;
  description: string;
}) {
  return (
    <label
      className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors ${
        checked ? "border-[var(--brand)] bg-[color-mix(in_srgb,var(--brand)_6%,white)]" : "border-[#e1eaf0] bg-white"
      }`}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={() => onChange(value)}
        className="mt-0.5 size-4 accent-[var(--brand)]"
      />
      <span>
        <span className="font-medium text-[#12233d]">{title}</span>
        <span className="block text-xs text-[#5a6578]">{description}</span>
      </span>
    </label>
  );
}

export function DiscountForm({
  action,
  products,
  discount,
}: {
  action: (prev: DiscountFormState, formData: FormData) => Promise<DiscountFormState>;
  products: { id: string; name: string; priceClp: number; active: boolean }[];
  discount?: DiscountFormValues;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const [clientErrors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const errors = { ...state.fieldErrors, ...clientErrors };
  const [type, setType] = useState(discount?.type ?? "percent");
  const [value, setValue] = useState(discount ? String(discount.value) : "");
  const [scope, setScope] = useState(discount?.scope ?? "all");
  const [coupon, setCoupon] = useState(discount?.couponCode ?? "");

  useEffect(() => {
    if (state.error) void toast.error(state.error);
  }, [state]);

  const n = Number(value);
  const example =
    Number.isInteger(n) && n > 0
      ? type === "percent"
        ? `Un producto de ${formatClp(10000)} queda en ${formatClp(10000 - Math.round((10000 * Math.min(n, 100)) / 100))}.`
        : coupon
          ? `Se descuentan ${formatClp(n)} del total del pedido.`
          : `Cada unidad queda ${formatClp(n)} más barata.`
      : null;

  return (
    <form
      noValidate
      encType="multipart/form-data"
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const data = new FormData(form);
        const found: Partial<Record<FieldKey, string>> = {};
        const name = String(data.get("name") ?? "").trim();
        if (name.length < 2) found.name = "El nombre debe tener al menos 2 caracteres.";
        const v = Number(String(data.get("value") ?? ""));
        if (!Number.isInteger(v) || v < 1) found.value = "Ingresa un número entero mayor que 0.";
        else if (type === "percent" && v > 100) found.value = "Un porcentaje no puede superar 100%.";
        if (scope === "products" && data.getAll("productIds").length === 0) {
          found.productIds = "Elige al menos un producto.";
        }
        const code = String(data.get("couponCode") ?? "").trim().toUpperCase().replace(/\s+/g, "");
        if (code && !/^[A-Z0-9_-]{3,40}$/.test(code)) {
          found.couponCode = "Usa 3 a 40 letras, números, guiones o guion bajo, sin espacios.";
        }
        const s = String(data.get("startsAt") ?? "");
        const en = String(data.get("endsAt") ?? "");
        if (s && en && en < s) found.endsAt = "La fecha de término es anterior al inicio.";
        if (clientErrors.image) found.image = clientErrors.image;
        const fields: FieldKey[] = ["name", "value", "productIds", "couponCode", "endsAt", "image"];
        setErrors(Object.fromEntries(fields.map((k) => [k, found[k]])));
        const first = fields.find((k) => found[k]);
        if (first) {
          form.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
          void toast.error("Revisa los campos marcados.");
          return;
        }
        startTransition(() => formAction(data));
      }}
    >
      {discount ? <input type="hidden" name="id" value={discount.id} /> : null}

      <section className="space-y-4">
        <h2 className="text-[15px] font-semibold text-[#12233d]">Descuento</h2>
        <Field id="name" label="Nombre" hint="Lo ven tus clientes, por ejemplo «Promo invierno»." error={errors.name}>
          <input
            id="name"
            name="name"
            maxLength={80}
            defaultValue={discount?.name}
            placeholder="Promo invierno"
            aria-invalid={Boolean(errors.name)}
            className={inputCls(Boolean(errors.name))}
          />
        </Field>

        <div className="grid gap-3 sm:grid-cols-2">
          <Choice
            name="type"
            value="percent"
            checked={type === "percent"}
            onChange={setType}
            title="Porcentaje (%)"
            description="Ej: 10% menos en el precio."
          />
          <Choice
            name="type"
            value="fixed"
            checked={type === "fixed"}
            onChange={setType}
            title="Monto fijo ($)"
            description="Ej: $1.000 menos."
          />
        </div>

        <Field
          id="value"
          label={type === "percent" ? "Porcentaje de descuento" : "Monto a descontar (CLP)"}
          hint={example ?? undefined}
          error={errors.value}
        >
          <div className="relative max-w-xs">
            <span aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#7b8aa0]">
              {type === "percent" ? "%" : "$"}
            </span>
            <input
              id="value"
              name="value"
              type="number"
              inputMode="numeric"
              min={1}
              max={type === "percent" ? 100 : undefined}
              step={1}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={type === "percent" ? "10" : "1000"}
              aria-invalid={Boolean(errors.value)}
              className={`${inputCls(Boolean(errors.value))} pl-7 tabular-nums`}
            />
          </div>
        </Field>
      </section>

      <section className="space-y-4 border-t border-[#e8f0f5] pt-5">
        <h2 className="text-[15px] font-semibold text-[#12233d]">¿A qué productos aplica?</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Choice
            name="scope"
            value="all"
            checked={scope === "all"}
            onChange={setScope}
            title="Todos los productos"
            description="Se aplica a todo el catálogo."
          />
          <Choice
            name="scope"
            value="products"
            checked={scope === "products"}
            onChange={setScope}
            title="Solo algunos productos"
            description="Elige cuáles en la lista."
          />
        </div>
        {scope === "products" ? (
          <fieldset>
            <legend className="sr-only">Productos con descuento</legend>
            {products.length === 0 ? (
              <p className="text-sm text-[#5a6578]">
                Aún no tienes productos. <Link href="/admin/productos/nuevo" className="font-medium text-[var(--brand-deep)] underline">Crea uno</Link>.
              </p>
            ) : (
              <ul className="grid max-h-72 gap-2 overflow-y-auto rounded-lg border border-[#e1eaf0] bg-[#fafcfd] p-2 sm:grid-cols-2">
                {products.map((p) => (
                  <li key={p.id}>
                    <label className="flex cursor-pointer items-center gap-2.5 rounded-md bg-white px-2.5 py-2 text-sm ring-1 ring-[#e8f0f5] hover:ring-[var(--brand)]/40">
                      <input
                        type="checkbox"
                        name="productIds"
                        value={p.id}
                        defaultChecked={discount?.productIds.includes(p.id)}
                        className="size-4 accent-[var(--brand)]"
                      />
                      <span className="min-w-0 flex-1 truncate">{p.name}</span>
                      <span className="tabular-nums text-xs text-[#6b7a8f]">{formatClp(p.priceClp)}</span>
                      {!p.active ? <span className="text-[10px] uppercase text-[#8a96a6]">oculto</span> : null}
                    </label>
                  </li>
                ))}
              </ul>
            )}
            {errors.productIds ? (
              <p className="mt-1.5 text-xs font-medium text-rose-700">{errors.productIds}</p>
            ) : null}
          </fieldset>
        ) : null}
      </section>

      <section className="space-y-4 border-t border-[#e8f0f5] pt-5">
        <h2 className="text-[15px] font-semibold text-[#12233d]">¿Cómo se activa?</h2>
        <Field
          id="couponCode"
          label="Código de cupón (opcional)"
          hint={
            coupon
              ? "El cliente escribe este código en el carrito para obtener el descuento."
              : "Vacío = descuento automático: los precios se muestran rebajados en la tienda."
          }
          error={errors.couponCode}
        >
          <input
            id="couponCode"
            name="couponCode"
            maxLength={40}
            value={coupon}
            onChange={(e) => setCoupon(e.target.value.toUpperCase().replace(/\s+/g, ""))}
            placeholder="BIENVENIDA"
            autoComplete="off"
            aria-invalid={Boolean(errors.couponCode)}
            className={`${inputCls(Boolean(errors.couponCode))} max-w-xs font-mono uppercase`}
          />
        </Field>
        <div className="grid max-w-md gap-4 sm:grid-cols-2">
          <Field id="startsAt" label="Desde (opcional)">
            <input
              id="startsAt"
              name="startsAt"
              type="date"
              defaultValue={discount?.startsAt ?? ""}
              className={inputCls(false)}
            />
          </Field>
          <Field id="endsAt" label="Hasta (opcional, inclusive)" error={errors.endsAt}>
            <input
              id="endsAt"
              name="endsAt"
              type="date"
              defaultValue={discount?.endsAt ?? ""}
              aria-invalid={Boolean(errors.endsAt)}
              className={inputCls(Boolean(errors.endsAt))}
            />
          </Field>
        </div>
        <label className="flex items-start gap-3 rounded-lg border border-[#e8f0f5] bg-[#fafcfd] px-3 py-2.5 text-sm">
          <input
            type="checkbox"
            name="active"
            defaultChecked={discount ? discount.active : true}
            className="mt-0.5 size-4 accent-[var(--brand)]"
          />
          <span>
            <span className="font-medium text-[#12233d]">Activo</span>
            <span className="block text-xs text-[#5a6578]">Desmárcalo para pausar el descuento sin borrarlo.</span>
          </span>
        </label>
      </section>

      <section className="space-y-4 border-t border-[#e8f0f5] pt-5">
        <div>
          <h2 className="text-[15px] font-semibold text-[#12233d]">Aviso en la tienda (opcional)</h2>
          <p className="mt-1 text-xs text-[#5a6578]">
            Si escribes un texto o subes una imagen, el descuento aparece en la sección «Descuentos» del inicio. Si lo dejas vacío, solo se ven los precios rebajados.
          </p>
        </div>
        <Field id="bannerText" label="Texto del aviso" error={errors.bannerText}>
          <input
            id="bannerText"
            name="bannerText"
            maxLength={160}
            defaultValue={discount?.bannerText ?? ""}
            placeholder="10% menos en todos los bidones hasta el domingo"
            className={inputCls(Boolean(errors.bannerText))}
          />
        </Field>
        <ImageDropzone
          name="image"
          label="Imagen del aviso (opcional)"
          currentUrl={discount?.imageUrl}
          error={errors.image}
          onErrorChange={(image) => setErrors((e) => ({ ...e, image }))}
        />
        {discount?.imageUrl ? (
          <label className="flex items-center gap-2 text-sm text-[#3d4a5c]">
            <input type="checkbox" name="removeImage" className="size-4 accent-[var(--brand)]" />
            Quitar la imagen actual
          </label>
        ) : null}
      </section>

      {state.error && !Object.keys(errors).some((k) => errors[k as FieldKey]) ? (
        <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {state.error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2 border-t border-[#e8f0f5] pt-4">
        <button type="submit" disabled={pending} className={adminButton()}>
          {pending ? <Loader2 aria-hidden className="animate-spin motion-reduce:animate-none" /> : <Save aria-hidden />}
          {pending ? "Guardando…" : discount ? "Guardar cambios" : "Crear descuento"}
        </button>
        <Link href="/admin/descuentos" className={adminButton({ variant: "ghost" })}>
          Cancelar
        </Link>
      </div>
    </form>
  );
}
