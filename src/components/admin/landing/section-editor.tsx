"use client";

import { ArrowDown, ArrowUp, ExternalLink, Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import {
  resetLandingSectionAction,
  saveLandingSectionAction,
} from "@/app/admin/(panel)/plataforma/landing/actions";
import { StatusPill, Switch } from "@/components/admin/landing/section-switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SECTION_META, type Field } from "@/lib/landing/admin-fields";
import { LANDING_DEFAULTS } from "@/lib/landing/defaults";
import { LANDING_ICON_NAMES } from "@/lib/landing/icon-names";
import { LANDING_ICONS } from "@/lib/landing/icons";
import type { LandingSectionKey } from "@/lib/landing/schema";

type Obj = Record<string, unknown>;
type Errors = Record<string, string>;

function newId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function FieldError({ errors, path }: { errors: Errors; path: string }) {
  const msg = errors[path];
  return msg ? <p className="mt-1 text-xs font-medium text-red-600">{msg}</p> : null;
}

function Hint({ text }: { text?: string }) {
  return text ? <p className="mt-1 text-xs text-[#5a6578]">{text}</p> : null;
}

function FieldView({
  field,
  value,
  onChange,
  path,
  errors,
}: {
  field: Field;
  value: unknown;
  onChange: (v: unknown) => void;
  path: string;
  errors: Errors;
}) {
  const id = `f-${path}`;
  const invalid = Boolean(errors[path]);

  switch (field.type) {
    case "text":
    case "url": {
      const v = String(value ?? "");
      return (
        <div>
          <div className="flex items-baseline justify-between gap-2">
            <Label htmlFor={id}>{field.label}</Label>
            <span className="text-[11px] tabular-nums text-[#8a96a6]">
              {v.length}/{field.max}
            </span>
          </div>
          <Input
            id={id}
            className="mt-1 bg-white"
            value={v}
            maxLength={field.max}
            aria-invalid={invalid}
            inputMode={field.type === "url" ? "url" : undefined}
            onChange={(e) => onChange(e.target.value)}
          />
          <Hint text={field.hint} />
          <FieldError errors={errors} path={path} />
        </div>
      );
    }
    case "textarea": {
      const v = String(value ?? "");
      return (
        <div>
          <div className="flex items-baseline justify-between gap-2">
            <Label htmlFor={id}>{field.label}</Label>
            <span className="text-[11px] tabular-nums text-[#8a96a6]">
              {v.length}/{field.max}
            </span>
          </div>
          <Textarea
            id={id}
            className="mt-1 min-h-20 bg-white"
            value={v}
            maxLength={field.max}
            aria-invalid={invalid}
            onChange={(e) => onChange(e.target.value)}
          />
          <Hint text={field.hint} />
          <FieldError errors={errors} path={path} />
        </div>
      );
    }
    case "number":
      return (
        <div>
          <Label htmlFor={id}>{field.label}</Label>
          <Input
            id={id}
            type="number"
            className="mt-1 max-w-48 bg-white"
            min={field.min}
            max={field.max}
            value={value === "" || value === undefined ? "" : Number(value)}
            aria-invalid={invalid}
            onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
          />
          <Hint text={field.hint} />
          <FieldError errors={errors} path={path} />
        </div>
      );
    case "bool":
      return (
        <div className="flex items-start justify-between gap-4 rounded-lg border border-[#d5e3ec] bg-white px-3 py-2.5">
          <div>
            <p className="text-sm font-medium text-[var(--brand-deep)]">{field.label}</p>
            <Hint text={field.hint} />
          </div>
          <Switch checked={Boolean(value)} label={field.label} onChange={onChange} />
        </div>
      );
    case "icon": {
      const name = (value as string | null) ?? "";
      const Icon = name ? LANDING_ICONS[name as keyof typeof LANDING_ICONS] : null;
      return (
        <div>
          <Label htmlFor={id}>{field.label}</Label>
          <div className="mt-1 flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-lg border border-[#d5e3ec] bg-[#eef8fc] text-[var(--brand)]">
              {Icon ? <Icon className="size-5" aria-hidden /> : <span className="text-xs text-[#8a96a6]">—</span>}
            </span>
            <select
              id={id}
              className="h-8 rounded-lg border border-input bg-white px-2 text-sm"
              value={name}
              onChange={(e) => onChange(e.target.value || null)}
            >
              {field.nullable ? <option value="">Sin ícono</option> : null}
              {LANDING_ICON_NAMES.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <FieldError errors={errors} path={path} />
        </div>
      );
    }
    case "group": {
      const obj = (value ?? {}) as Obj;
      return (
        <fieldset className="space-y-4 rounded-xl border border-[#d5e3ec] bg-[#f7fbfd] p-4">
          <legend className="px-1 text-sm font-bold text-[var(--brand-deep)]">{field.label}</legend>
          {field.fields.map((f) => (
            <FieldView
              key={f.key}
              field={f}
              value={obj[f.key]}
              path={`${path}.${f.key}`}
              errors={errors}
              onChange={(v) => onChange({ ...obj, [f.key]: v })}
            />
          ))}
        </fieldset>
      );
    }
    case "list":
      return <ListField field={field} value={value} onChange={onChange} path={path} errors={errors} />;
  }
}

function ListField({
  field,
  value,
  onChange,
  path,
  errors,
}: {
  field: Extract<Field, { type: "list" }>;
  value: unknown;
  onChange: (v: unknown) => void;
  path: string;
  errors: Errors;
}) {
  const items = (Array.isArray(value) ? value : []) as Obj[];
  const move = (from: number, to: number) => {
    const next = [...items];
    const [it] = next.splice(from, 1);
    next.splice(to, 0, it!);
    onChange(next);
  };
  const hasNestedError = Object.keys(errors).some((k) => k.startsWith(`${path}.`));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-bold text-[var(--brand-deep)]">
          {field.label} <span className="font-normal text-[#5a6578]">({items.length}/{field.max})</span>
        </p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={items.length >= field.max}
          onClick={() => onChange([...items, { id: newId(field.key), ...structuredClone(field.newItem) }])}
        >
          <Plus aria-hidden /> Agregar {field.itemLabel.toLowerCase()}
        </Button>
      </div>
      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-[#c9d6e0] p-4 text-center text-xs text-[#5a6578]">
          Sin elementos. Si la lista queda vacía, el bloque no se muestra.
        </p>
      ) : null}
      <ol className="space-y-3">
        {items.map((item, i) => {
          const title = String(item[field.titleKey] ?? "") || `${field.itemLabel} ${i + 1}`;
          const itemPath = `${path}.${i}`;
          const itemHasError = Object.keys(errors).some((k) => k.startsWith(`${itemPath}.`));
          return (
            <li key={String(item.id ?? i)}>
              <details
                open={itemHasError || undefined}
                className={`group rounded-xl border bg-white ${itemHasError ? "border-red-300" : "border-[#d5e3ec]"}`}
              >
                <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2.5">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-[#eef8fc] text-xs font-bold text-[var(--brand)]">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-[var(--brand-deep)]">
                    {title}
                  </span>
                  {"active" in item ? <StatusPill enabled={Boolean(item.active)} /> : null}
                  <span className="flex items-center gap-1" onClick={(e) => e.preventDefault()}>
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      aria-label="Subir"
                      disabled={i === 0}
                      onClick={() => move(i, i - 1)}
                    >
                      <ArrowUp aria-hidden />
                    </Button>
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      aria-label="Bajar"
                      disabled={i === items.length - 1}
                      onClick={() => move(i, i + 1)}
                    >
                      <ArrowDown aria-hidden />
                    </Button>
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      aria-label="Eliminar"
                      className="text-red-600 hover:bg-red-50 hover:text-red-700"
                      onClick={() => {
                        if (confirm(`¿Eliminar “${title}”?`)) onChange(items.filter((_, k) => k !== i));
                      }}
                    >
                      <Trash2 aria-hidden />
                    </Button>
                  </span>
                </summary>
                <div className="space-y-4 border-t border-[#e3ebf1] p-4">
                  {field.fields.map((f) => (
                    <FieldView
                      key={f.key}
                      field={f}
                      value={item[f.key]}
                      path={`${itemPath}.${f.key}`}
                      errors={errors}
                      onChange={(v) => onChange(items.map((it, k) => (k === i ? { ...it, [f.key]: v } : it)))}
                    />
                  ))}
                </div>
              </details>
            </li>
          );
        })}
      </ol>
      {hasNestedError ? null : <FieldError errors={errors} path={path} />}
    </div>
  );
}

export function SectionEditor({
  sectionKey,
  initialEnabled,
  initialContent,
  updatedAt,
  updatedBy,
}: {
  sectionKey: LandingSectionKey;
  initialEnabled: boolean;
  initialContent: Obj;
  updatedAt: string | null;
  updatedBy: string | null;
}) {
  const meta = SECTION_META.find((s) => s.key === sectionKey)!;
  const router = useRouter();
  const [enabled, setEnabled] = useState(initialEnabled);
  const [content, setContent] = useState<Obj>(initialContent);
  const [baseline, setBaseline] = useState(() => JSON.stringify([initialEnabled, initialContent]));
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [pending, start] = useTransition();

  const dirty = useMemo(() => JSON.stringify([enabled, content]) !== baseline, [enabled, content, baseline]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const save = () =>
    start(async () => {
      setStatus(null);
      const res = await saveLandingSectionAction(sectionKey, enabled, content);
      if (res.ok) {
        setErrors({});
        setBaseline(JSON.stringify([enabled, content]));
        setStatus({ tone: "ok", text: "Guardado. La landing ya muestra los cambios." });
        router.refresh();
      } else {
        setErrors(Object.fromEntries((res.issues ?? []).map((i) => [i.path, i.message])));
        setStatus({ tone: "error", text: res.error });
      }
    });

  const reset = () => {
    if (!confirm("¿Restaurar el contenido original de esta sección? Se perderán tus cambios.")) return;
    start(async () => {
      const res = await resetLandingSectionAction(sectionKey);
      if (res.ok) {
        const def = LANDING_DEFAULTS[sectionKey];
        const c = structuredClone(def.content) as Obj;
        setEnabled(def.enabled);
        setContent(c);
        setBaseline(JSON.stringify([def.enabled, c]));
        setErrors({});
        setStatus({ tone: "ok", text: "Contenido original restaurado." });
        router.refresh();
      } else {
        setStatus({ tone: "error", text: res.error });
      }
    });
  };

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--brand-deep)] md:text-[26px]">
            {meta.title}
          </h1>
          <p className="mt-1 max-w-xl text-sm text-[#5a6578]">{meta.description}</p>
          {updatedAt ? (
            <p className="mt-1 text-xs text-[#8a96a6]" suppressHydrationWarning>
              Última edición: {new Date(updatedAt).toLocaleString("es-CL")}
              {updatedBy ? ` · ${updatedBy}` : ""}
            </p>
          ) : null}
        </div>
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--brand)] hover:underline"
        >
          Ver landing <ExternalLink className="size-4" aria-hidden />
        </a>
      </header>

      <div className="flex items-center justify-between gap-4 rounded-xl border border-[#dde7ee] bg-white px-5 py-3.5 shadow-[0_1px_2px_rgba(16,40,70,0.04)]">
        <div>
          <p className="text-sm font-bold text-[var(--brand-deep)]">Sección visible en la landing</p>
          <p className="text-xs text-[#5a6578]">
            Desactivada = no se renderiza y sus enlaces del menú se ocultan.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <StatusPill enabled={enabled} />
          <Switch
            checked={enabled}
            label="Sección visible"
            onChange={(v) => {
              setStatus(null);
              setEnabled(v);
            }}
          />
        </div>
      </div>

      <div className="space-y-5 rounded-xl border border-[#dde7ee] bg-white p-5 shadow-[0_1px_2px_rgba(16,40,70,0.04)]">
        {meta.fields.map((f) => (
          <FieldView
            key={f.key}
            field={f}
            value={content[f.key]}
            path={f.key}
            errors={errors}
            onChange={(v) => {
              setStatus(null);
              setContent((c) => ({ ...c, [f.key]: v }));
            }}
          />
        ))}
      </div>

      <div className="sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#dde7ee] bg-white/95 px-5 py-3 shadow-[0_-6px_16px_-12px_rgba(16,40,70,0.25)] backdrop-blur">
        <div className="min-h-5 text-sm" aria-live="polite">
          {status ? (
            <span className={status.tone === "ok" ? "font-medium text-emerald-700" : "font-medium text-red-600"}>
              {status.text}
            </span>
          ) : dirty ? (
            <span className="text-[#5a6578]">Cambios sin guardar</span>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" disabled={pending} onClick={reset}>
            <RotateCcw aria-hidden /> Restaurar original
          </Button>
          <Button
            type="submit"
            disabled={pending || !dirty}
            className="bg-[var(--brand)] text-white hover:bg-[var(--brand-deep)]"
          >
            <Save aria-hidden /> {pending ? "Guardando…" : "Guardar cambios"}
          </Button>
        </div>
      </div>
    </form>
  );
}
