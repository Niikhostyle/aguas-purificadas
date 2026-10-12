import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowDown, ArrowUp, Eye, EyeOff, ExternalLink, LayoutGrid, Plus, Save, Trash2 } from "lucide-react";
import {
  deleteListItemAction,
  moveListItemAction,
  saveListItemAction,
  saveSocialLinksAction,
  setSectionVisibleAction,
} from "../actions";
import { ConfirmSubmitButton, EmptyState, PageHeader, Panel, adminButton } from "@/components/admin/ui";
import { ImageDropzone } from "@/components/admin/ui/image-dropzone";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { requireAdmin } from "@/lib/auth";
import { LIST_SPECS, isListKind, itemTitle, listItems, type ListItem, type ListSpec } from "@/lib/content-lists";
import { parseModuleFlags, parseModulesContent } from "@/lib/modules";

export const dynamic = "force-dynamic";

function ItemFields({ spec, item }: { spec: ListSpec; item?: ListItem }) {
  const key = item?.id ?? "new";
  const value = (name: string) => item?.[name];
  return (
    <div className={spec.image ? "grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,300px)]" : ""}>
      <div className="grid gap-3 sm:grid-cols-2">
        {spec.fields.map((f) => {
          const id = `${f.name}-${key}`;
          const wide = f.type === "textarea" || f.type === "lines" || f.type === "checkbox" || f.type === "audience";
          const hint = f.hint ? <p className="text-xs text-[#7b8aa0]">{f.hint}</p> : null;
          if (f.type === "checkbox") {
            return (
              <label key={f.name} className="flex items-center gap-2 text-sm text-[#12233d] sm:col-span-2">
                <input type="checkbox" name={f.name} defaultChecked={value(f.name) === true} className="size-4 accent-[var(--brand)]" />
                {f.label}
              </label>
            );
          }
          if (f.type === "audience") {
            const current = (value(f.name) as string | undefined) ?? "ambos";
            return (
              <fieldset key={f.name} className="space-y-1.5 sm:col-span-2">
                <legend className="text-sm font-medium text-[#12233d]">{f.label}</legend>
                <div className="flex flex-wrap gap-2">
                  {[
                    ["ambos", "Hogar y empresa"],
                    ["hogar", "Solo hogar"],
                    ["empresa", "Solo empresa"],
                  ].map(([v, label]) => (
                    <label
                      key={v}
                      className="flex cursor-pointer items-center gap-2 rounded-lg border border-[#d5e3ec] px-3 py-1.5 text-sm has-[:checked]:border-[var(--brand)] has-[:checked]:bg-[color-mix(in_srgb,var(--brand)_8%,white)]"
                    >
                      <input type="radio" name={f.name} value={v} defaultChecked={current === v} className="accent-[var(--brand)]" />
                      {label}
                    </label>
                  ))}
                </div>
                {hint}
              </fieldset>
            );
          }
          const raw = value(f.name);
          const defaultValue = Array.isArray(raw) ? raw.join("\n") : typeof raw === "string" ? raw : "";
          return (
            <div key={f.name} className={`space-y-1.5 ${wide ? "sm:col-span-2" : ""}`}>
              <Label htmlFor={id}>{f.label}</Label>
              {f.type === "textarea" || f.type === "lines" ? (
                <Textarea
                  id={id}
                  name={f.name}
                  rows={f.type === "lines" ? 4 : 2}
                  maxLength={f.max}
                  defaultValue={defaultValue}
                  placeholder={f.placeholder}
                />
              ) : (
                <Input
                  id={id}
                  name={f.name}
                  required={f.required}
                  maxLength={f.max}
                  defaultValue={defaultValue}
                  placeholder={f.placeholder}
                />
              )}
              {hint}
            </div>
          );
        })}
      </div>
      {spec.image ? (
        <div className="space-y-2">
          <ImageDropzone name="image" label={spec.image.label} currentUrl={value(spec.image.field) as string | undefined} />
          {value(spec.image.field) ? (
            <label className="flex items-center gap-2 text-xs text-[#5a6578]">
              <input type="checkbox" name="removeImage" className="size-4 accent-[var(--brand)]" />
              Quitar la imagen actual
            </label>
          ) : null}
          <p className="text-xs text-[#5a6578]">{spec.image.hint}</p>
        </div>
      ) : null}
    </div>
  );
}

export default async function ContentListPage({ params }: { params: Promise<{ kind: string }> }) {
  const { kind } = await params;
  if (!isListKind(kind)) notFound();
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login");
  if (admin.role === "super_admin" && admin.tenant.slug === "plataforma") redirect("/admin/plataforma");

  const spec = LIST_SPECS[kind];
  const content = parseModulesContent(admin.tenant.modulesContent);
  const visible = parseModuleFlags(admin.tenant.modulesEnabled)[spec.flag];
  const items = listItems(content, kind);
  const canAdd = items.length < spec.max;

  return (
    <div className="max-w-5xl space-y-5">
      <PageHeader
        title={spec.title}
        description={spec.description}
        breadcrumbs={[{ label: "Tu página web" }, { label: spec.title }]}
        actions={
          <Link href={`/#${spec.anchor}`} target="_blank" className={adminButton({ variant: "secondary" })}>
            <ExternalLink aria-hidden />
            Ver en la tienda
          </Link>
        }
      />

      <form
        action={setSectionVisibleAction}
        className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${
          visible ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-amber-200 bg-amber-50 text-amber-900"
        }`}
      >
        <input type="hidden" name="kind" value={kind} />
        <input type="hidden" name="visible" value={visible ? "0" : "1"} />
        <p className="flex items-center gap-2 font-medium">
          {visible ? <Eye className="size-4" aria-hidden /> : <EyeOff className="size-4" aria-hidden />}
          {visible
            ? items.length || kind === "redes"
              ? "Esta sección se muestra en tu tienda."
              : "Esta sección está activa, pero no se ve hasta que agregues el primero."
            : "Esta sección está oculta en tu tienda."}
        </p>
        <button type="submit" className={adminButton({ variant: "secondary", size: "sm" })}>
          {visible ? "Ocultar sección" : "Mostrar en la tienda"}
        </button>
      </form>

      {kind === "redes" ? (
        <Panel
          title="Tus redes sociales"
          description="Aparecen como botones en la sección «Redes» y en el pie de página de tu tienda."
        >
          <form action={saveSocialLinksAction} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              {(
                [
                  ["instagramUrl", "Instagram", admin.tenant.instagramUrl, "https://www.instagram.com/tu_cuenta"],
                  ["facebookUrl", "Facebook", admin.tenant.facebookUrl, "https://www.facebook.com/tu_pagina"],
                  ["youtubeUrl", "YouTube", admin.tenant.youtubeUrl, "https://www.youtube.com/@tu_canal"],
                ] as const
              ).map(([name, label, value, placeholder]) => (
                <div key={name} className="space-y-1.5">
                  <Label htmlFor={name}>{label}</Label>
                  <Input id={name} name={name} defaultValue={value ?? ""} placeholder={placeholder} maxLength={300} />
                </div>
              ))}
            </div>
            <div className="flex justify-end">
              <button type="submit" className={adminButton()}>
                <Save aria-hidden />
                Guardar redes
              </button>
            </div>
          </form>
        </Panel>
      ) : null}

      {items.length === 0 ? (
        <Panel>
          <EmptyState
            icon={<LayoutGrid />}
            title={kind === "redes" ? "Sin videos por ahora" : `Aún no tienes ${spec.title.toLowerCase()}`}
            description={
              kind === "redes"
                ? "Con tus redes guardadas arriba la sección ya muestra los botones. Si quieres, agrega videos abajo."
                : "Agrega el primero con el formulario de abajo."
            }
          />
        </Panel>
      ) : (
        items.map((item, i) => {
          const title = itemTitle(spec, item);
          return (
            <Panel
              key={item.id}
              title={`${i + 1}. ${title}`}
              actions={
                <>
                  {(["up", "down"] as const).map((direction) => (
                    <form key={direction} action={moveListItemAction}>
                      <input type="hidden" name="kind" value={kind} />
                      <input type="hidden" name="id" value={item.id} />
                      <input type="hidden" name="direction" value={direction} />
                      <button
                        type="submit"
                        disabled={direction === "up" ? i === 0 : i === items.length - 1}
                        aria-label={`${direction === "up" ? "Subir" : "Bajar"} ${title}`}
                        className={adminButton({ variant: "ghost", size: "sm" })}
                      >
                        {direction === "up" ? <ArrowUp aria-hidden /> : <ArrowDown aria-hidden />}
                      </button>
                    </form>
                  ))}
                  <form action={deleteListItemAction}>
                    <input type="hidden" name="kind" value={kind} />
                    <input type="hidden" name="id" value={item.id} />
                    <ConfirmSubmitButton
                      confirmTitle={`¿Eliminar «${title}»?`}
                      confirmText="Deja de mostrarse en la tienda de inmediato."
                      confirmLabel="Sí, eliminar"
                      className={adminButton({ variant: "danger", size: "sm" })}
                    >
                      <Trash2 aria-hidden />
                      Eliminar
                    </ConfirmSubmitButton>
                  </form>
                </>
              }
            >
              <form action={saveListItemAction} className="space-y-4">
                <input type="hidden" name="kind" value={kind} />
                <input type="hidden" name="id" value={item.id} />
                <ItemFields spec={spec} item={item} />
                <div className="flex justify-end">
                  <button type="submit" className={adminButton()}>
                    <Save aria-hidden />
                    Guardar cambios
                  </button>
                </div>
              </form>
            </Panel>
          );
        })
      )}

      {canAdd ? (
        <Panel title={`Agregar ${spec.singular}`} description={`Puedes tener hasta ${spec.max}.`}>
          <form key={items.length} action={saveListItemAction} className="space-y-4">
            <input type="hidden" name="kind" value={kind} />
            <ItemFields spec={spec} />
            <div className="flex justify-end">
              <button type="submit" className={adminButton()}>
                <Plus aria-hidden />
                Agregar {spec.singular}
              </button>
            </div>
          </form>
        </Panel>
      ) : (
        <p className="text-sm text-[#5a6578]">Llegaste al máximo de {spec.max}.</p>
      )}
    </div>
  );
}
