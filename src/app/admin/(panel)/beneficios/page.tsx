import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowDown, ArrowUp, ExternalLink, Plus, Save, Sparkles, Trash2 } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { GENERIC_BENEFITS, MAX_BENEFITS, parseModulesContent, type BenefitItem } from "@/lib/modules";
import { ConfirmSubmitButton, PageHeader, Panel, adminButton } from "@/components/admin/ui";
import { ImageDropzone } from "@/components/admin/ui/image-dropzone";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  deleteBenefitAction,
  moveBenefitAction,
  saveBenefitAction,
  saveBenefitsTitleAction,
} from "./actions";

function BenefitFields({ item }: { item?: BenefitItem }) {
  const key = item?.id ?? "new";
  return (
    <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,320px)]">
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor={`title-${key}`}>Título</Label>
          <Input
            id={`title-${key}`}
            name="title"
            required
            maxLength={60}
            defaultValue={item?.title ?? ""}
            placeholder="Ej: Despacho a domicilio"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`body-${key}`}>Texto (opcional)</Label>
          <Textarea
            id={`body-${key}`}
            name="body"
            rows={3}
            maxLength={220}
            defaultValue={item?.body ?? ""}
            placeholder="Una o dos frases que expliquen el beneficio."
          />
        </div>
      </div>
      <div className="space-y-2">
        <ImageDropzone name="image" label="Imagen (opcional)" currentUrl={item?.imageUrl} />
        {item?.imageUrl ? (
          <label className="flex items-center gap-2 text-xs text-[#5a6578]">
            <input type="checkbox" name="removeImage" className="size-4 accent-[var(--brand)]" />
            Quitar la imagen actual
          </label>
        ) : (
          <p className="text-xs text-[#5a6578]">Sin imagen se muestra un ícono con los colores de tu marca. Ideal 1200 × 750 px.</p>
        )}
      </div>
    </div>
  );
}

export default async function BenefitsAdminPage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login");
  if (admin.role === "super_admin" && admin.tenant.slug === "plataforma") {
    redirect("/admin/plataforma");
  }

  const content = parseModulesContent(admin.tenant.modulesContent);
  const usingGeneric = content.beneficios.length === 0;
  const items = usingGeneric ? GENERIC_BENEFITS : content.beneficios;
  const canAdd = items.length < MAX_BENEFITS;

  return (
    <div className="max-w-5xl space-y-5">
      <PageHeader
        title="Beneficios"
        description="La sección «¿Por qué elegirnos?» de tu tienda: escribe tus propios beneficios y, si quieres, agrega una foto a cada uno."
        breadcrumbs={[{ label: "Configuración" }, { label: "Beneficios" }]}
        actions={
          <Link href="/#beneficios" target="_blank" className={adminButton({ variant: "secondary" })}>
            <ExternalLink aria-hidden />
            Ver en la tienda
          </Link>
        }
      />

      <Panel title="Título de la sección">
        <form action={saveBenefitsTitleAction} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="benefits-title">Título</Label>
            <Input
              id="benefits-title"
              name="title"
              maxLength={80}
              defaultValue={content.beneficiosTitle ?? ""}
              placeholder="¿Por qué elegirnos?"
            />
          </div>
          <button type="submit" className={adminButton({ variant: "secondary" })}>
            <Save aria-hidden />
            Guardar título
          </button>
        </form>
      </Panel>

      {usingGeneric ? (
        <div className="flex items-start gap-3 rounded-xl border border-[#cfe3f1] bg-[#f3f9fd] p-4 text-sm text-[#12233d]">
          <Sparkles className="mt-0.5 size-4 shrink-0 text-[var(--brand)]" aria-hidden />
          <p>
            Estos son los beneficios que tu tienda muestra hoy. Cambia el texto, agrega una foto, ordénalos o elimina los que no
            apliquen: al guardar el primer cambio pasan a ser tuyos.
          </p>
        </div>
      ) : null}

      {items.map((item, i) => (
          <Panel
            key={item.id}
            title={`${i + 1}. ${item.title}`}
            actions={
              <>
                <form action={moveBenefitAction}>
                  <input type="hidden" name="id" value={item.id} />
                  <input type="hidden" name="direction" value="up" />
                  <button
                    type="submit"
                    disabled={i === 0}
                    aria-label={`Subir ${item.title}`}
                    className={adminButton({ variant: "ghost", size: "sm" })}
                  >
                    <ArrowUp aria-hidden />
                  </button>
                </form>
                <form action={moveBenefitAction}>
                  <input type="hidden" name="id" value={item.id} />
                  <input type="hidden" name="direction" value="down" />
                  <button
                    type="submit"
                    disabled={i === items.length - 1}
                    aria-label={`Bajar ${item.title}`}
                    className={adminButton({ variant: "ghost", size: "sm" })}
                  >
                    <ArrowDown aria-hidden />
                  </button>
                </form>
                <form action={deleteBenefitAction}>
                  <input type="hidden" name="id" value={item.id} />
                  <ConfirmSubmitButton
                    confirmTitle={`¿Eliminar «${item.title}»?`}
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
            <form action={saveBenefitAction} className="space-y-4">
              <input type="hidden" name="id" value={item.id} />
              <BenefitFields item={item} />
              <div className="flex justify-end">
                <button type="submit" className={adminButton()}>
                  <Save aria-hidden />
                  Guardar cambios
                </button>
              </div>
            </form>
          </Panel>
      ))}

      {canAdd ? (
        <Panel title="Agregar beneficio" description={`Puedes tener hasta ${MAX_BENEFITS}. Se ven mejor 3, 4 o 6.`}>
          <form action={saveBenefitAction} className="space-y-4">
            <BenefitFields />
            <div className="flex justify-end">
              <button type="submit" className={adminButton()}>
                <Plus aria-hidden />
                Agregar beneficio
              </button>
            </div>
          </form>
        </Panel>
      ) : (
        <p className="text-sm text-[#5a6578]">Llegaste al máximo de {MAX_BENEFITS} beneficios.</p>
      )}
    </div>
  );
}
