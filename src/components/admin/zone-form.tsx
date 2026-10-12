"use client";

import { useId, useState } from "react";
import { Plus, Save } from "lucide-react";
import { adminButton } from "@/components/admin/ui/button-styles";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { splitCommunes } from "@/lib/delivery-zones";
import { formatClp } from "@/lib/utils";

export type ZoneFormValues = {
  id?: string;
  name: string;
  communes: string;
  costClp: number;
  freeOverClp: number | null;
  active: boolean;
};

function toInt(v: string): number {
  const n = Number(v.replace(/[$.\s]/g, ""));
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

export function ZoneForm({
  action,
  zone,
  cityHint,
}: {
  action: (formData: FormData) => void | Promise<void>;
  zone?: ZoneFormValues;
  cityHint?: string | null;
}) {
  const id = useId();
  const [name, setName] = useState(zone?.name ?? "");
  const [communes, setCommunes] = useState(zone?.communes ?? "");
  const [cost, setCost] = useState(zone ? String(zone.costClp || "") : "");
  const [freeOver, setFreeOver] = useState(zone?.freeOverClp ? String(zone.freeOverClp) : "");
  const [active, setActive] = useState(zone?.active ?? true);

  const costClp = toInt(cost);
  const freeOverClp = toInt(freeOver);
  const communeList = splitCommunes(communes);

  return (
    <form action={action} className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)]">
      {zone?.id ? <input type="hidden" name="id" value={zone.id} /> : null}
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor={`${id}-name`}>Nombre de la zona</Label>
          <Input
            id={`${id}-name`}
            name="name"
            required
            minLength={2}
            maxLength={60}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={cityHint ? `Ej: ${cityHint} urbano` : "Ej: Centro"}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${id}-communes`}>Comunas o sectores</Label>
          <Textarea
            id={`${id}-communes`}
            name="communes"
            rows={2}
            maxLength={600}
            value={communes}
            onChange={(e) => setCommunes(e.target.value)}
            placeholder={cityHint ? `Ej: ${cityHint}, Pelluhue, Curanipe` : "Ej: Talca, Maule, San Clemente"}
          />
          <p className="text-xs text-[#5a6578]">Sepáralas con comas. Se sugieren al cliente cuando escribe su comuna.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor={`${id}-cost`}>Costo de despacho (CLP)</Label>
            <Input
              id={`${id}-cost`}
              name="costClp"
              inputMode="numeric"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              placeholder="0 = gratis"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`${id}-free`}>Gratis desde (opcional)</Label>
            <Input
              id={`${id}-free`}
              name="freeOverClp"
              inputMode="numeric"
              value={freeOver}
              onChange={(e) => setFreeOver(e.target.value)}
              placeholder="Ej: 20000"
              disabled={costClp === 0}
            />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-[#12233d]">
          <input
            type="checkbox"
            name="active"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="size-4 accent-[var(--brand)]"
          />
          Zona activa (se muestra en el checkout)
        </label>
        <div className="flex justify-end">
          <button type="submit" className={adminButton()}>
            {zone?.id ? <Save aria-hidden /> : <Plus aria-hidden />}
            {zone?.id ? "Guardar zona" : "Agregar zona"}
          </button>
        </div>
      </div>

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8a96a6]">Así se ve en el checkout</p>
        <div
          className={`mt-2 flex gap-3 rounded-xl border px-4 py-3.5 transition ${
            active ? "border-[var(--brand)] bg-[color-mix(in_srgb,var(--brand)_6%,#fff)]" : "border-dashed border-[#d5e3ec] bg-[#fafcfd] opacity-60"
          }`}
        >
          <span className="mt-1 size-4 shrink-0 rounded-full border-4 border-[var(--brand)] bg-white" aria-hidden />
          <span className="min-w-0">
            <span className="block font-medium text-[var(--brand-deep)]">{name || "Nombre de la zona"}</span>
            <span className="block text-sm text-[#5a6578]">
              {communeList.length ? communeList.join(", ") : "Comunas que cubre"}
            </span>
            <span className="mt-1.5 flex flex-wrap gap-1.5">
              <span className="inline-flex rounded-full bg-[color-mix(in_srgb,var(--brand)_12%,#fff)] px-2.5 py-0.5 text-xs font-semibold text-[var(--brand)]">
                {costClp === 0 ? "Despacho gratis" : `Despacho ${formatClp(costClp)}`}
              </span>
              {costClp > 0 && freeOverClp > 0 ? (
                <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                  Gratis sobre {formatClp(freeOverClp)}
                </span>
              ) : null}
            </span>
          </span>
        </div>
        {!active ? <p className="mt-2 text-xs text-[#5a6578]">Inactiva: no aparece en el checkout.</p> : null}
      </div>
    </form>
  );
}
