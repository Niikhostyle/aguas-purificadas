"use client";

import Link from "next/link";
import { startTransition, useActionState, useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";
import type { ProductFormState } from "@/app/admin/actions";
import { toast } from "@/lib/alerts";
import { adminButton } from "./ui/button-styles";
import { ImageDropzone } from "./ui/image-dropzone";

type Product = {
  id: string;
  name: string;
  slug: string;
  priceClp: number;
  description: string | null;
  imageUrl: string | null;
  active: boolean;
};

type FieldKey = keyof NonNullable<ProductFormState["fieldErrors"]>;

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

function validate(form: FormData): Partial<Record<FieldKey, string>> {
  const errors: Partial<Record<FieldKey, string>> = {};
  const name = String(form.get("name") ?? "").trim();
  if (name.length < 2) errors.name = "El nombre debe tener al menos 2 caracteres.";
  else if (name.length > 120) errors.name = "Máximo 120 caracteres.";
  const slug = String(form.get("slug") ?? "").trim();
  if (slug && !/^[a-z0-9-]+$/.test(slug)) errors.slug = "Usa solo minúsculas, números y guiones.";
  const priceRaw = String(form.get("priceClp") ?? "").trim();
  const price = Number(priceRaw);
  if (!priceRaw || !Number.isInteger(price)) errors.priceClp = "Ingresa un precio entero en pesos.";
  else if (price < 0) errors.priceClp = "El precio no puede ser negativo.";
  else if (price > 10_000_000) errors.priceClp = "El precio es demasiado alto.";
  if (String(form.get("description") ?? "").length > 2000) errors.description = "Máximo 2000 caracteres.";
  return errors;
}

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

export function ProductForm({
  action,
  product,
}: {
  action: (prev: ProductFormState, formData: FormData) => Promise<ProductFormState>;
  product?: Product;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  /** Client checks; an explicit `undefined` clears a server error for that field. */
  const [clientErrors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const errors = { ...state.fieldErrors, ...clientErrors };
  const [touchedSlug, setTouchedSlug] = useState(Boolean(product));
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [descLength, setDescLength] = useState(product?.description?.length ?? 0);

  useEffect(() => {
    if (state.error) void toast.error(state.error);
  }, [state]);

  const describedBy = (key: FieldKey, hint = false) =>
    errors[key] ? `${key}-error` : hint ? `${key}-hint` : undefined;

  const revalidateField = (key: FieldKey, form: HTMLFormElement | null) => {
    if (!form || !errors[key]) return;
    const next = validate(new FormData(form));
    setErrors((e) => ({ ...e, [key]: next[key] }));
  };

  return (
    <form
      noValidate
      encType="multipart/form-data"
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const data = new FormData(form);
        const found = validate(data);
        if (clientErrors.image) found.image = clientErrors.image;
        const fields: FieldKey[] = ["name", "priceClp", "slug", "image", "description"];
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
      {product ? <input type="hidden" name="id" value={product.id} /> : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="name" label="Nombre" error={errors.name}>
          <input
            id="name"
            name="name"
            required
            maxLength={120}
            defaultValue={product?.name}
            placeholder="Bidón 20 L"
            aria-invalid={Boolean(errors.name)}
            aria-describedby={describedBy("name")}
            className={inputCls(Boolean(errors.name))}
            onChange={(e) => {
              if (!touchedSlug) setSlug(slugify(e.target.value));
              revalidateField("name", e.currentTarget.form);
            }}
          />
        </Field>
        <Field id="priceClp" label="Precio (CLP)" hint="Precio final con IVA, sin puntos." error={errors.priceClp}>
          <div className="relative">
            <span aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#7b8aa0]">
              $
            </span>
            <input
              id="priceClp"
              name="priceClp"
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              required
              defaultValue={product?.priceClp}
              placeholder="3500"
              aria-invalid={Boolean(errors.priceClp)}
              aria-describedby={describedBy("priceClp", true)}
              className={`${inputCls(Boolean(errors.priceClp))} pl-7 tabular-nums`}
              onChange={(e) => revalidateField("priceClp", e.currentTarget.form)}
            />
          </div>
        </Field>
      </div>

      <Field
        id="slug"
        label="Dirección en la tienda (slug)"
        hint={`Se verá como /productos/${slug || "nombre-del-producto"}`}
        error={errors.slug}
      >
        <input
          id="slug"
          name="slug"
          maxLength={80}
          value={slug}
          placeholder="bidon-20l"
          aria-invalid={Boolean(errors.slug)}
          aria-describedby={describedBy("slug", true)}
          className={`${inputCls(Boolean(errors.slug))} font-mono`}
          onChange={(e) => {
            setTouchedSlug(true);
            setSlug(e.target.value);
            revalidateField("slug", e.currentTarget.form);
          }}
        />
      </Field>

      <ImageDropzone
        name="image"
        label={product?.imageUrl ? "Imagen del producto" : "Imagen del producto (opcional)"}
        currentUrl={product?.imageUrl}
        error={errors.image}
        onErrorChange={(image) => setErrors((e) => ({ ...e, image }))}
      />

      <Field id="description" label="Descripción" hint={`${descLength}/2000 caracteres`} error={errors.description}>
        <textarea
          id="description"
          name="description"
          rows={4}
          maxLength={2000}
          defaultValue={product?.description ?? ""}
          placeholder="Agua purificada por osmosis inversa, ideal para dispensadores…"
          aria-invalid={Boolean(errors.description)}
          aria-describedby={describedBy("description", true)}
          className={`${inputCls(Boolean(errors.description))} h-auto py-2`}
          onChange={(e) => setDescLength(e.target.value.length)}
        />
      </Field>

      <label className="flex items-start gap-3 rounded-lg border border-[#e8f0f5] bg-[#fafcfd] px-3 py-2.5 text-sm">
        <input
          type="checkbox"
          name="active"
          defaultChecked={product ? product.active : true}
          className="mt-0.5 size-4 accent-[var(--brand)]"
        />
        <span>
          <span className="font-medium text-[#12233d]">Publicado en la tienda</span>
          <span className="block text-xs text-[#5a6578]">Si lo desmarcas, el producto queda oculto pero no se borra.</span>
        </span>
      </label>

      {state.error && !Object.keys(errors).some((k) => errors[k as FieldKey]) ? (
        <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {state.error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2 border-t border-[#e8f0f5] pt-4">
        <button type="submit" disabled={pending} className={adminButton()}>
          {pending ? <Loader2 aria-hidden className="animate-spin motion-reduce:animate-none" /> : <Save aria-hidden />}
          {pending ? "Guardando…" : product ? "Guardar cambios" : "Crear producto"}
        </button>
        <Link href="/admin/productos" className={adminButton({ variant: "ghost" })}>
          Cancelar
        </Link>
      </div>
    </form>
  );
}
