"use client";

import { useEffect, useId, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { ImageIcon, RotateCcw, Save, Undo2 } from "lucide-react";
import {
  resetAppearanceAction,
  saveAppearanceAction,
} from "@/app/admin/(panel)/apariencia/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { confirmAction } from "@/lib/alerts";
import {
  DEFAULT_LOGIN_TITLE,
  DEFAULT_PANEL_SUBTITLE,
  HEX_RE,
  IMAGE_KEYS,
  KPI_TONES,
  colorDefaults,
  fill,
  heroOverlay,
  kpiFill,
  kpiToneColors,
  resolveAppearance,
  type AppearanceOverrides,
  type ColorKey,
  type ImageKey,
  type KpiToneKey,
} from "@/lib/appearance";

type Initial = {
  name: string;
  tagline: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string | null;
  overrides: AppearanceOverrides;
};

type ImgKey = ImageKey | "logoUrl";
type ImgState = { saved: string | null; preview: string | null; cleared: boolean };

const CARD =
  "rounded-xl border border-[#dde7ee] bg-white shadow-[0_1px_2px_rgba(16,40,70,0.04)]";

const KPI_LABELS: Record<KpiToneKey, { label: string; sample: string; value: string }> = {
  brand: { label: "Principal", sample: "Pedidos hoy", value: "18" },
  navy: { label: "Azul marino", sample: "Ventas 7 días", value: "$412.300" },
  info: { label: "Celeste", sample: "En ruta", value: "6" },
  success: { label: "Verde", sample: "Ventas hoy", value: "$86.900" },
  warning: { label: "Ámbar", sample: "Pendientes despacho", value: "4" },
  danger: { label: "Rojo", sample: "Próximos a reponer", value: "9" },
};

const IMAGE_HINTS: Record<ImgKey, string> = {
  logoUrl: "PNG, SVG, JPG o WEBP · máx. 2 MB · fondo transparente ideal.",
  logoDarkUrl: "Versión clara para fondos oscuros · PNG, SVG, JPG o WEBP · máx. 2 MB.",
  faviconUrl: "Cuadrado (ej. 512×512) · PNG, SVG, ICO o WEBP · máx. 1 MB.",
  panelLogoUrl: "Cuadrado ideal · PNG, SVG, JPG o WEBP · máx. 2 MB.",
  loginBgUrl: "JPG, PNG o WEBP · máx. 5 MB · se ve con una capa clara encima.",
  loginLogoUrl: "PNG, SVG, JPG o WEBP · máx. 2 MB.",
};

const IMAGE_ACCEPT: Record<ImgKey, string> = {
  logoUrl: "image/png,image/svg+xml,image/jpeg,image/webp",
  logoDarkUrl: "image/png,image/svg+xml,image/jpeg,image/webp",
  faviconUrl: "image/png,image/svg+xml,image/x-icon,image/vnd.microsoft.icon,image/webp,.ico",
  panelLogoUrl: "image/png,image/svg+xml,image/jpeg,image/webp",
  loginBgUrl: "image/jpeg,image/png,image/webp",
  loginLogoUrl: "image/png,image/svg+xml,image/jpeg,image/webp",
};

function isHex(v: string) {
  return HEX_RE.test(v.trim());
}

export function AppearanceEditor({
  initial,
  heroImageUrl,
}: {
  initial: Initial;
  heroImageUrl: string | null;
}) {
  const [name, setName] = useState(initial.name);
  const [tagline, setTagline] = useState(initial.tagline);
  const [primary, setPrimary] = useState(initial.primaryColor);
  const [secondary, setSecondary] = useState(initial.secondaryColor);
  const [o, setO] = useState<AppearanceOverrides>(() => {
    const copy = { ...initial.overrides };
    for (const k of IMAGE_KEYS) delete copy[k];
    return copy;
  });
  const [images, setImages] = useState<Record<ImgKey, ImgState>>(() => {
    const out = {} as Record<ImgKey, ImgState>;
    out.logoUrl = { saved: initial.logoUrl, preview: null, cleared: false };
    for (const k of IMAGE_KEYS) out[k] = { saved: initial.overrides[k] ?? null, preview: null, cleared: false };
    return out;
  });
  const [dirty, setDirty] = useState(false);

  const base = useMemo(
    () => ({
      primary: isHex(primary) ? primary.toLowerCase() : initial.primaryColor.toLowerCase(),
      secondary: isHex(secondary) ? secondary.toLowerCase() : initial.secondaryColor.toLowerCase(),
    }),
    [primary, secondary, initial.primaryColor, initial.secondaryColor],
  );
  const defaults = useMemo(() => colorDefaults(base), [base]);
  const resolved = useMemo(() => {
    const valid: AppearanceOverrides = { ...o };
    for (const [k, v] of Object.entries(o)) {
      if (k in defaults && typeof v === "string" && !isHex(v)) delete valid[k as ColorKey];
    }
    return resolveAppearance(base, valid);
  }, [o, base, defaults]);
  const c = resolved.colors;

  const img = (k: ImgKey) => {
    const s = images[k];
    if (s.preview) return s.preview;
    return s.cleared ? null : s.saved;
  };

  const touch = () => setDirty(true);
  const setColor = (k: ColorKey, v: string) => {
    touch();
    setO((prev) => {
      const next = { ...prev };
      if (!v.trim()) delete next[k];
      else next[k] = v.trim();
      return next;
    });
  };
  const set = <K extends keyof AppearanceOverrides>(k: K, v: AppearanceOverrides[K]) => {
    touch();
    setO((prev) => ({ ...prev, [k]: v }));
  };

  const color = (k: ColorKey, label: string) => (
    <ColorField
      key={k}
      label={label}
      value={o[k] ?? defaults[k]}
      customized={o[k] !== undefined && o[k] !== defaults[k]}
      onChange={(v) => setColor(k, v)}
      onReset={() => setColor(k, "")}
    />
  );

  const imageField = (k: ImgKey, label: string, preview: ReactNode) => (
    <ImageField
      key={k}
      field={k}
      label={label}
      hint={IMAGE_HINTS[k]}
      accept={IMAGE_ACCEPT[k]}
      hasValue={Boolean(img(k))}
      cleared={images[k].cleared}
      preview={preview}
      onFile={(url) => {
        touch();
        setImages((s) => ({ ...s, [k]: { ...s[k], preview: url, cleared: false } }));
      }}
      onClear={() => {
        touch();
        setImages((s) => ({ ...s, [k]: { ...s[k], preview: null, cleared: true } }));
      }}
    />
  );

  const logo = img("logoUrl");
  const logoDark = img("logoDarkUrl");
  const favicon = img("faviconUrl");
  const panelLogo = img("panelLogoUrl");
  const loginBg = img("loginBgUrl");
  const loginLogo = img("loginLogoUrl");

  return (
    <form action={saveAppearanceAction} className="mt-4 space-y-8 pb-4">
      <input type="hidden" name="appearanceJson" value={JSON.stringify(o)} />
      {(Object.keys(images) as ImgKey[]).map((k) =>
        images[k].cleared ? <input key={k} type="hidden" name={`clear_${k}`} value="1" /> : null,
      )}

      <Section title="Identidad" description="Nombre, logos e ícono que ven tus clientes.">
        <Row
          preview={
            <MiniHeader c={c} name={name} logo={logo} />
          }
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="ap-name">Nombre de la tienda</Label>
              <Input id="ap-name" name="name" required minLength={2} maxLength={120} value={name} onChange={(e) => { touch(); setName(e.target.value); }} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ap-tagline">Tagline</Label>
              <Input id="ap-tagline" name="tagline" maxLength={200} value={tagline} onChange={(e) => { touch(); setTagline(e.target.value); }} />
            </div>
            <ColorField
              label="Color principal de marca"
              name="primaryColor"
              value={primary}
              help="Base de enlaces, precios y valores por defecto."
              onChange={(v) => { touch(); setPrimary(v); }}
            />
            <ColorField
              label="Color secundario (acento)"
              name="secondaryColor"
              value={secondary}
              help="Títulos, textos destacados y pie de página."
              onChange={(v) => { touch(); setSecondary(v); }}
            />
          </div>
        </Row>
        <div className="grid gap-4 lg:grid-cols-3">
          {imageField(
            "logoUrl",
            "Logo del encabezado",
            <div className="flex h-20 items-center justify-center rounded-lg border border-[#e8f0f5] bg-[var(--prev-header)] px-3" style={{ "--prev-header": c.storeHeaderBg } as CSSProperties}>
              {logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logo} alt="" className="max-h-14 w-auto object-contain" />
              ) : (
                <span className="rc-display text-2xl uppercase" style={{ color: c.storeHeaderText }}>{name || "Tu tienda"}</span>
              )}
            </div>,
          )}
          {imageField(
            "logoDarkUrl",
            "Logo para pie de página / fondos oscuros",
            <div className="flex h-20 items-center justify-center rounded-lg px-3" style={{ background: c.storeFooterBg }}>
              {logoDark ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoDark} alt="" className="max-h-14 w-auto object-contain" />
              ) : logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logo} alt="" className="max-h-14 w-auto object-contain brightness-0 invert" />
              ) : (
                <span className="rc-display text-2xl uppercase" style={{ color: c.storeFooterText }}>{name || "Tu tienda"}</span>
              )}
            </div>,
          )}
          {imageField(
            "faviconUrl",
            "Ícono de la pestaña del navegador",
            <BrowserTab icon={favicon} title={name || "Tu tienda"} />,
          )}
        </div>
      </Section>

      <Section title="Tienda online" description="Colores de tu sitio público. Los campos sin cambiar siguen a tus colores de marca.">
        <Row title="Barra superior de avisos" preview={<div className="rounded-md px-3 py-2 text-[11px]" style={{ background: c.storeTopbarBg, color: c.storeTopbarText }}>🚚 Despacho a comunas seleccionadas · 🕒 Lun a Vie 8:30–17:30</div>}>
          <Grid>{color("storeTopbarBg", "Fondo")}{color("storeTopbarText", "Texto")}</Grid>
        </Row>
        <Row title="Encabezado y menú" preview={<MiniHeader c={c} name={name} logo={logo} hideTopbar />}>
          <Grid>
            {color("storeHeaderBg", "Fondo")}
            {color("storeHeaderText", "Texto del menú")}
            {color("storeHeaderHover", "Enlace al pasar el cursor")}
          </Grid>
        </Row>
        <Row
          title="Botones principales"
          preview={
            <div className="flex flex-wrap items-center gap-2 rounded-md bg-[#f7fbfd] p-4">
              <span className="inline-flex px-4 py-2 text-xs font-bold uppercase tracking-wide" style={{ background: fill(c.storeButtonBg, c.storeButtonBg2, resolved.storeButtonGradient), color: c.storeButtonText }}>
                Agregar al carrito
              </span>
              <span className="inline-flex rounded-md px-4 py-2 text-xs font-semibold" style={{ background: fill(c.storeButtonBg, c.storeButtonBg2, resolved.storeButtonGradient), color: c.storeButtonText }}>
                Ir a pagar
              </span>
            </div>
          }
        >
          <Grid>
            {color("storeButtonBg", "Color del botón")}
            {color("storeButtonText", "Texto del botón")}
            <div className="space-y-1.5">
              <Toggle
                label="Aplicar degradado"
                checked={resolved.storeButtonGradient}
                onChange={(v) => set("storeButtonGradient", v)}
              />
              {resolved.storeButtonGradient ? color("storeButtonBg2", "Segundo color del degradado") : null}
            </div>
          </Grid>
        </Row>
        <Row
          title="Capa sobre el banner del inicio"
          preview={
            <div className="relative h-28 overflow-hidden rounded-md bg-[#9fb7c9] bg-cover bg-center" style={heroImageUrl ? { backgroundImage: `url("${heroImageUrl}")` } : undefined}>
              <div className="absolute inset-0" style={{ background: heroOverlay(resolved) }} />
              <div className="relative p-3 text-white">
                <p className="rc-display text-2xl uppercase leading-none">Agua pura a tu puerta</p>
                <span className="mt-2 inline-flex px-3 py-1 text-[10px] font-bold uppercase" style={{ background: fill(c.storeButtonBg, c.storeButtonBg2, resolved.storeButtonGradient), color: c.storeButtonText }}>Ver productos</span>
              </div>
            </div>
          }
        >
          <Grid>
            {color("storeHeroOverlay", "Color de la capa")}
            <div className="space-y-1.5">
              <Label htmlFor="ap-hero-op">Intensidad: {resolved.storeHeroOpacity}%</Label>
              <input
                id="ap-hero-op"
                type="range"
                min={0}
                max={100}
                value={resolved.storeHeroOpacity}
                onChange={(e) => set("storeHeroOpacity", Number(e.target.value))}
                className="h-8 w-full accent-[var(--brand)]"
              />
            </div>
          </Grid>
        </Row>
        <Row
          title="Pie de página"
          preview={
            <div className="rounded-md p-3" style={{ background: c.storeFooterBg, color: c.storeFooterText }}>
              <p className="rc-display text-lg uppercase">Llámanos</p>
              <p className="text-sm font-bold">+56 9 1234 5678</p>
              <p className="mt-1 text-[11px] opacity-80">Despacho en tu comuna</p>
            </div>
          }
        >
          <Grid>{color("storeFooterBg", "Fondo")}{color("storeFooterText", "Texto")}</Grid>
        </Row>
      </Section>

      <Section title="Panel de administración" description="Cómo se ve este panel para ti y tu equipo.">
        <div className="grid gap-4 lg:grid-cols-3">
          <div className={`${CARD} space-y-3 p-4 lg:col-span-1`}>
            <p className="text-sm font-semibold text-[#12233d]">Vista previa: pantalla de acceso</p>
            <div
              className="flex h-48 flex-col items-center justify-center rounded-lg bg-[linear-gradient(160deg,#e8f7fc_0%,#f7fbfd_50%,#d5e3ec_100%)] bg-cover bg-center p-3"
              style={loginBg ? { backgroundImage: `linear-gradient(160deg,rgba(255,255,255,0.86),rgba(255,255,255,0.7)),url("${loginBg}")` } : undefined}
            >
              {loginLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={loginLogo} alt="" className="mb-2 h-8 w-auto object-contain" />
              ) : null}
              <p className="rc-display text-xl text-[#12326e]">{o.loginTitle || DEFAULT_LOGIN_TITLE}</p>
              <div className="mt-2 w-40 space-y-1.5 rounded-md border border-[#d5e3ec] bg-white p-2">
                <div className="h-3 rounded bg-[#eef3f7]" />
                <div className="h-3 rounded bg-[#eef3f7]" />
                <div className="h-4 rounded bg-[#00b1e2]" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ap-login-title">Título de la pantalla de acceso</Label>
              <Input id="ap-login-title" maxLength={60} placeholder={DEFAULT_LOGIN_TITLE} value={o.loginTitle ?? ""} onChange={(e) => set("loginTitle", e.target.value)} />
            </div>
          </div>
          {imageField("loginBgUrl", "Fondo de la pantalla de acceso", null)}
          {imageField("loginLogoUrl", "Logo de la pantalla de acceso", null)}
        </div>

        <Row
          title="Barra lateral"
          preview={<MiniSidebar c={c} gradient={resolved.adminSidebarGradient} name={name} subtitle={o.panelSubtitle || DEFAULT_PANEL_SUBTITLE} logo={panelLogo} />}
        >
          <Grid>
            {color("adminSidebarBg", "Fondo")}
            <div className="space-y-1.5">
              <Toggle label="Aplicar degradado" checked={resolved.adminSidebarGradient} onChange={(v) => set("adminSidebarGradient", v)} />
              {resolved.adminSidebarGradient ? color("adminSidebarBg2", "Segundo color del degradado") : null}
            </div>
            {color("adminSidebarText", "Texto")}
            {color("adminActiveBg", "Enlace seleccionado")}
            {color("adminActiveText", "Texto del enlace seleccionado")}
            {color("adminHoverBg", "Fondo al pasar el cursor")}
          </Grid>
        </Row>

        <Row
          title="Nombre y logo del panel"
          preview={<MiniSidebar c={c} gradient={resolved.adminSidebarGradient} name={name} subtitle={o.panelSubtitle || DEFAULT_PANEL_SUBTITLE} logo={panelLogo} compact />}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="ap-panel-sub">Subtítulo bajo el nombre</Label>
              <Input id="ap-panel-sub" maxLength={40} placeholder={DEFAULT_PANEL_SUBTITLE} value={o.panelSubtitle ?? ""} onChange={(e) => set("panelSubtitle", e.target.value)} />
              <p className="text-xs text-[#5a6578]">El nombre es el de tu tienda (sección Identidad).</p>
            </div>
            {imageField("panelLogoUrl", "Logo del panel", null)}
          </div>
        </Row>

        <Row
          title="Barra superior del panel"
          preview={
            <div className="flex items-center justify-between rounded-md border border-[#dde7ee] px-3 py-2" style={{ background: c.adminTopbarBg, color: c.adminTopbarText }}>
              <span className="h-5 w-24 rounded bg-[#f4f8fb]" />
              <span className="text-right text-[11px] leading-tight">
                <span className="block font-semibold">admin@tienda.cl</span>
                <span className="opacity-70">Administrador</span>
              </span>
            </div>
          }
        >
          <Grid>{color("adminTopbarBg", "Fondo")}{color("adminTopbarText", "Texto")}</Grid>
        </Row>

        <div className={`${CARD} space-y-4 p-4`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[#12233d]">Recuadros de cifras del dashboard</p>
              <p className="text-xs text-[#5a6578]">Elige si se colorea solo el ícono o toda la tarjeta.</p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <div className="inline-flex rounded-lg border border-[#d5e3ec] p-0.5 text-sm">
                {(["icon", "filled"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={resolved.kpiStyle === s}
                    onClick={() => set("kpiStyle", s)}
                    className={`rounded-md px-3 py-1 ${resolved.kpiStyle === s ? "bg-[var(--brand)] text-white" : "text-[#3d4a5c] hover:bg-[#f4f8fb]"}`}
                  >
                    {s === "icon" ? "Ícono de color" : "Tarjeta completa"}
                  </button>
                ))}
              </div>
              <Toggle label="Aplicar degradado" checked={resolved.kpiGradient} onChange={(v) => set("kpiGradient", v)} />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {KPI_TONES.map((tone) => (
              <KpiRow key={tone} tone={tone} resolved={resolved}>
                {color(`kpi${tone[0].toUpperCase()}${tone.slice(1)}Bg` as ColorKey, `${KPI_LABELS[tone].label}: color`)}
                {color(`kpi${tone[0].toUpperCase()}${tone.slice(1)}Text` as ColorKey, "Texto / ícono")}
              </KpiRow>
            ))}
          </div>
        </div>
      </Section>

      <StickyBar dirty={dirty} />
    </form>
  );
}

function Section({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <section className="space-y-4">
      <div className="border-b border-[#dde7ee] pb-2">
        <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-[#5a6578]">{title}</h2>
        <p className="mt-0.5 text-sm text-[#5a6578]">{description}</p>
      </div>
      {children}
    </section>
  );
}

function Row({ title, preview, children }: { title?: string; preview: ReactNode; children: ReactNode }) {
  return (
    <div className={`${CARD} grid gap-5 p-4 lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)]`}>
      <div className="space-y-1.5">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8a96a6]">Vista previa</p>
        {preview}
      </div>
      <div className="space-y-3">
        {title ? <p className="text-sm font-semibold text-[#12233d]">{title}</p> : null}
        {children}
      </div>
    </div>
  );
}

function Grid({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{children}</div>;
}

function ColorField({
  label,
  value,
  onChange,
  onReset,
  customized,
  name,
  help,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onReset?: () => void;
  customized?: boolean;
  name?: string;
  help?: string;
}) {
  const id = useId();
  const valid = isHex(value);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={id}>{label}</Label>
        {customized && onReset ? (
          <button type="button" onClick={onReset} className="inline-flex items-center gap-1 text-[11px] text-[var(--brand)] hover:underline">
            <Undo2 className="size-3" aria-hidden /> Restablecer
          </button>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-label={`${label}: selector`}
          value={valid ? value.toLowerCase() : "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-10 shrink-0 cursor-pointer rounded-md border border-[#d5e3ec] bg-white p-0.5"
        />
        <Input
          id={id}
          name={name}
          value={value}
          maxLength={7}
          spellCheck={false}
          aria-invalid={!valid || undefined}
          onChange={(e) => onChange(e.target.value)}
          className="font-mono uppercase"
        />
      </div>
      {!valid ? (
        <p className="text-xs text-red-600">Usa el formato #RRGGBB</p>
      ) : help ? (
        <p className="text-xs text-[#5a6578]">{help}</p>
      ) : null}
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-[#12233d]">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="size-4 accent-[var(--brand)]" />
      {label}
    </label>
  );
}

function ImageField({
  field,
  label,
  hint,
  accept,
  hasValue,
  cleared,
  preview,
  onFile,
  onClear,
}: {
  field: ImgKey;
  label: string;
  hint: string;
  accept: string;
  hasValue: boolean;
  cleared: boolean;
  preview: ReactNode;
  onFile: (url: string) => void;
  onClear: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const urlRef = useRef<string | null>(null);
  useEffect(() => () => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
  }, []);

  return (
    <div className={`${CARD} space-y-3 p-4`}>
      <p className="text-sm font-semibold text-[#12233d]">{label}</p>
      {preview ? (
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8a96a6]">Vista previa</p>
          {preview}
        </div>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" variant="outline" onClick={() => inputRef.current?.click()}>
          <ImageIcon aria-hidden /> Seleccionar archivo
        </Button>
        <span className="text-xs text-[#5a6578]">
          {hasValue ? (cleared ? "" : "Imagen personalizada") : "Usando valor de fábrica"}
        </span>
      </div>
      <input
        ref={inputRef}
        type="file"
        name={field === "logoUrl" ? "logoFile" : `file_${field}`}
        accept={accept}
        className="sr-only"
        aria-label={label}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          if (urlRef.current) URL.revokeObjectURL(urlRef.current);
          urlRef.current = URL.createObjectURL(file);
          onFile(urlRef.current);
        }}
      />
      <p className="text-xs text-[#5a6578]">{hint}</p>
      {hasValue ? (
        <button
          type="button"
          onClick={() => {
            if (inputRef.current) inputRef.current.value = "";
            onClear();
          }}
          className="text-xs font-medium text-red-600 hover:underline"
        >
          Quitar y volver al valor de fábrica
        </button>
      ) : null}
    </div>
  );
}

function BrowserTab({ icon, title }: { icon: string | null; title: string }) {
  return (
    <div className="rounded-lg bg-[#dee3ea] px-2 pt-2">
      <div className="flex w-56 max-w-full items-center gap-2 rounded-t-lg bg-white px-3 py-2 text-xs text-[#3d4a5c]">
        {icon ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={icon} alt="" className="size-4 shrink-0 object-contain" />
        ) : (
          <span aria-hidden className="grid size-4 shrink-0 place-items-center rounded-sm bg-[#00b1e2] text-[8px] font-black text-white">M</span>
        )}
        <span className="truncate">{title}</span>
        <span aria-hidden className="ml-auto text-[#8a96a6]">×</span>
      </div>
    </div>
  );
}

function MiniHeader({
  c,
  name,
  logo,
  hideTopbar,
}: {
  c: Record<ColorKey, string>;
  name: string;
  logo: string | null;
  hideTopbar?: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-md border border-[#e8f0f5]">
      {hideTopbar ? null : (
        <div className="px-2 py-1 text-[9px]" style={{ background: c.storeTopbarBg, color: c.storeTopbarText }}>
          🚚 Despacho a domicilio
        </div>
      )}
      <div className="flex items-center justify-between gap-2 px-2 py-2" style={{ background: c.storeHeaderBg }}>
        {logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logo} alt="" className="h-7 w-auto max-w-24 object-contain" />
        ) : (
          <span className="rc-display truncate text-base uppercase" style={{ color: c.storeHeaderText }}>{name || "Tu tienda"}</span>
        )}
        <span className="flex gap-2 text-[9px] font-bold uppercase">
          <span style={{ color: c.storeHeaderText }}>Inicio</span>
          <span className="underline" style={{ color: c.storeHeaderHover }} title="Al pasar el cursor">Productos</span>
          <span style={{ color: c.storeHeaderText }}>Contacto</span>
        </span>
      </div>
    </div>
  );
}

function MiniSidebar({
  c,
  gradient,
  name,
  subtitle,
  logo,
  compact,
}: {
  c: Record<ColorKey, string>;
  gradient: boolean;
  name: string;
  subtitle: string;
  logo: string | null;
  compact?: boolean;
}) {
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "A";
  return (
    <div className="rounded-md p-3" style={{ background: fill(c.adminSidebarBg, c.adminSidebarBg2, gradient), color: c.adminSidebarText }}>
      <div className="flex items-center gap-2">
        {logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logo} alt="" className="size-8 rounded-lg bg-white object-contain p-0.5" />
        ) : (
          <span className="grid size-8 place-items-center rounded-lg bg-[linear-gradient(135deg,#00b1e2,#0a6fb0)] text-xs font-black text-white">{initials}</span>
        )}
        <span className="min-w-0 leading-tight">
          <span className="block truncate text-sm font-bold brightness-125">{name || "Tu tienda"}</span>
          <span className="block truncate text-[10px] opacity-70">{subtitle}</span>
        </span>
      </div>
      {compact ? null : (
        <ul className="mt-3 space-y-1 text-xs">
          <li className="rounded-md px-2 py-1.5 font-medium" style={{ background: c.adminActiveBg, color: c.adminActiveText }}>Dashboard (seleccionado)</li>
          <li className="rounded-md px-2 py-1.5" style={{ background: c.adminHoverBg, color: c.adminActiveText }}>Pedidos (cursor encima)</li>
          <li className="px-2 py-1.5">Productos</li>
        </ul>
      )}
    </div>
  );
}

function KpiRow({ tone, resolved, children }: { tone: KpiToneKey; resolved: ReturnType<typeof resolveAppearance>; children: ReactNode }) {
  const { bg, text } = kpiToneColors(resolved, tone);
  const filled = resolved.kpiStyle === "filled";
  const sample = KPI_LABELS[tone];
  return (
    <div className="space-y-3 rounded-lg border border-[#e8f0f5] p-3">
      <div
        className="flex items-center gap-3 rounded-xl border p-3"
        style={
          filled
            ? { background: kpiFill(resolved, tone), color: text, borderColor: "transparent" }
            : { background: "#fff", borderColor: "#dde7ee" }
        }
      >
        <span
          aria-hidden
          className="grid size-9 shrink-0 place-items-center rounded-full text-sm font-bold"
          style={filled ? { background: `color-mix(in srgb, ${text} 18%, transparent)`, color: text } : { background: bg, color: text }}
        >
          #
        </span>
        <span className="min-w-0 leading-tight">
          <span className="block text-[12px]" style={{ color: filled ? text : "#5a6578", opacity: filled ? 0.85 : 1 }}>{sample.sample}</span>
          <span className="block text-lg font-bold tabular-nums" style={{ color: filled ? text : "#12233d" }}>{sample.value}</span>
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function StickyBar({ dirty }: { dirty: boolean }) {
  const { pending } = useFormStatus();
  return (
    <div className="sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#dde7ee] bg-white/95 px-5 py-3 shadow-[0_-6px_16px_-12px_rgba(16,40,70,0.25)] backdrop-blur">
      <div className="min-h-5 text-sm text-[#5a6578]" aria-live="polite">
        {pending ? "Guardando…" : dirty ? "Cambios sin guardar" : ""}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="submit"
          variant="outline"
          disabled={pending}
          formAction={resetAppearanceAction}
          onClick={async (e) => {
            e.preventDefault();
            const button = e.currentTarget;
            const ok = await confirmAction({
              title: "¿Volver a los valores originales?",
              text: "Se borran los colores personalizados de la tienda y del panel, el ícono, el logo alternativo y la pantalla de acceso. Tu nombre, logo principal y colores de marca se mantienen.",
              confirmText: "Restaurar",
              tone: "warning",
            });
            if (ok) button.form?.requestSubmit(button);
          }}
        >
          <RotateCcw aria-hidden /> Volver a los valores originales
        </Button>
        <Button type="submit" disabled={pending} className="bg-[var(--brand)] text-white hover:bg-[var(--brand-deep)]">
          <Save aria-hidden /> {pending ? "Guardando…" : "Guardar cambios"}
        </Button>
      </div>
    </div>
  );
}
