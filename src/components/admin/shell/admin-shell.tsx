"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Suspense,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  Bell,
  BellRing,
  Blocks,
  Building2,
  ChevronDown,
  ClipboardList,
  ExternalLink,
  LayoutDashboard,
  LayoutTemplate,
  LogOut,
  Map as MapIcon,
  MapPinned,
  Menu,
  Package,
  Paintbrush,
  Palette,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Printer,
  Recycle,
  Search,
  Smartphone,
  Sparkles,
  Store,
  TicketPercent,
  Truck,
  X,
  type LucideIcon,
} from "lucide-react";
import { logoutAction } from "@/app/admin/actions";
import { ConfirmSubmitButton } from "../ui/confirm-submit";
import { FlashToaster } from "../ui/flash-toaster";
import { CommandPalette, type PaletteAction } from "./command-palette";
import "../admin-ux.css";
import {
  PLATFORM_NAV,
  TENANT_NAV,
  isNavItemActive,
  type AdminNavGroup,
  type AdminNavIcon,
  type AdminNavItem,
} from "./nav";

const ICONS: Record<AdminNavIcon, LucideIcon> = {
  dashboard: LayoutDashboard,
  dispatch: Truck,
  map: MapIcon,
  zones: MapPinned,
  alerts: BellRing,
  orders: ClipboardList,
  reminders: BellRing,
  containers: Recycle,
  products: Package,
  discounts: TicketPercent,
  brand: Palette,
  benefits: Sparkles,
  appearance: Paintbrush,
  modules: Blocks,
  tenants: Building2,
  newTenant: Plus,
  landing: LayoutTemplate,
  store: Store,
};

export type AdminNotification = {
  id: string;
  label: string;
  href: string;
  count: number;
  tone?: "info" | "warning" | "danger";
};

type Props = {
  variant: "tenant" | "platform";
  orgName: string;
  orgSubtitle?: string;
  orgLogoUrl?: string;
  email: string;
  roleLabel: string;
  siteHref: string;
  siteLabel: string;
  notifications: AdminNotification[];
  /** Nav hrefs to hide (e.g. modules the tenant has switched off). */
  hiddenHrefs?: string[];
  /** Computed on the server so the footer never differs between SSR and hydration. */
  year: string;
  children: ReactNode;
};

const COLLAPSE_KEY = "mibidon-admin-sidebar-collapsed";

function useDismiss(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);
  return ref;
}

function initials(name: string) {
  return (
    name
      .split(/[\s@._-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("") || "A"
  );
}

function SidebarNav({
  groups,
  pathname,
  collapsed,
  onNavigate,
}: {
  groups: AdminNavGroup[];
  pathname: string;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const [closedGroups, setClosedGroups] = useState<Record<string, boolean>>({});

  return (
    <nav aria-label="Navegación del panel" className="flex-1 overflow-y-auto px-3 py-4">
      {groups.map((group) => {
        const groupOpen = collapsed || !closedGroups[group.label];
        const listId = `nav-group-${group.label.replace(/\W+/g, "-").toLowerCase()}`;
        return (
          <div key={group.label} className="mb-4 last:mb-0">
            {collapsed ? (
              <div className="mx-auto mb-2 h-px w-6 bg-white/10" aria-hidden />
            ) : (
              <button
                type="button"
                aria-expanded={groupOpen}
                aria-controls={listId}
                onClick={() =>
                  setClosedGroups((s) => ({ ...s, [group.label]: !s[group.label] }))
                }
                className="flex w-full items-center justify-between rounded-md px-2.5 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--admin-sidebar-text)] opacity-75 hover:opacity-100 focus-visible:outline-2 focus-visible:outline-[var(--brand)]"
              >
                {group.label}
                <ChevronDown
                  aria-hidden
                  className={`size-3.5 transition-transform ${groupOpen ? "" : "-rotate-90"}`}
                />
              </button>
            )}
            <ul id={listId} hidden={!groupOpen} className="space-y-0.5">
              {group.items.map((item) => (
                <li key={item.href}>
                  <SidebarLink
                    item={item}
                    active={isNavItemActive(item, pathname)}
                    collapsed={collapsed}
                    onNavigate={onNavigate}
                  />
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}

function SidebarLink({
  item,
  active,
  collapsed,
  onNavigate,
}: {
  item: AdminNavItem;
  active: boolean;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const Icon = ICONS[item.icon];
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      title={collapsed ? item.label : undefined}
      className={`group relative flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--brand)] ${
        collapsed ? "justify-center" : ""
      } ${
        active
          ? "bg-[var(--admin-active-bg)] text-[var(--admin-active-text)] shadow-[0_6px_18px_-8px_rgba(0,0,0,0.45)]"
          : "text-[var(--admin-sidebar-text)] hover:bg-[var(--admin-hover-bg)] hover:text-[var(--admin-active-text)]"
      }`}
    >
      <Icon aria-hidden className="size-[18px] shrink-0" />
      <span className={collapsed ? "sr-only" : "truncate"}>{item.label}</span>
    </Link>
  );
}

function PaletteTrigger({ onOpen }: { onOpen: () => void }) {
  return (
    <>
      <button
        type="button"
        onClick={onOpen}
        aria-haspopup="dialog"
        aria-keyshortcuts="Control+K Meta+K"
        className="group relative hidden h-9 w-full max-w-md items-center rounded-lg border border-[#d5e3ec] bg-[#f4f8fb] pl-9 pr-14 text-left text-sm text-[#7b8aa0] transition-colors hover:border-[var(--brand)]/60 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--brand)] sm:flex"
      >
        <Search aria-hidden className="absolute left-3 top-1/2 size-4 -translate-y-1/2" />
        Buscar sección o acción…
        <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-[#d5e3ec] bg-white px-1.5 py-0.5 font-mono text-[10px] text-[#7b8aa0]">
          Ctrl K
        </kbd>
      </button>
      <button
        type="button"
        onClick={onOpen}
        aria-haspopup="dialog"
        aria-label="Buscar sección o acción"
        className="grid size-9 place-items-center rounded-lg border border-[#d5e3ec] text-[#3d4a5c] hover:bg-[#f4f8fb] sm:hidden"
      >
        <Search aria-hidden className="size-[18px]" />
      </button>
    </>
  );
}

function buildActions(variant: Props["variant"], hidden: Set<string>, siteHref: string, siteLabel: string): PaletteAction[] {
  const list: (PaletteAction & { requires?: string })[] =
    variant === "platform"
      ? [
          { id: "new-tenant", label: "Crear empresa", icon: Plus, href: "/admin/plataforma/nueva", keywords: "nueva cliente alta" },
          { id: "suspended", label: "Empresas suspendidas", icon: Building2, href: "/admin/plataforma/empresas?estado=suspendidas" },
          { id: "landing", label: "Editar landing mibidon.cl", icon: LayoutTemplate, href: "/admin/plataforma/landing" },
        ]
      : [
          { id: "new-product", label: "Nuevo producto", icon: Plus, href: "/admin/productos/nuevo", keywords: "crear agregar catalogo" },
          { id: "new-discount", label: "Nuevo descuento o cupón", icon: TicketPercent, href: "/admin/descuentos/nuevo", keywords: "promocion oferta rebaja cupon porcentaje" },
          { id: "zones", label: "Zonas y costos de despacho", icon: MapPinned, href: "/admin/zonas", keywords: "comunas envio delivery costo gratis" },
          { id: "alerts", label: "Alertas: morosos, sin compra y envases", icon: BellRing, href: "/admin/alertas", keywords: "deudores cobrar pendientes avisos clientes inactivos bidones stock" },
          { id: "benefits", label: "Editar beneficios de la tienda", icon: Sparkles, href: "/admin/beneficios", keywords: "por que elegirnos ventajas destacados" },
          { id: "pending-pay", label: "Pedidos con pago pendiente", icon: ClipboardList, href: "/admin/pedidos?pago=pending", keywords: "webpay" },
          { id: "unassigned", label: "Pedidos sin ruta asignada", icon: Truck, href: "/admin/despacho?fecha=todas&estado=por_asignar", requires: "/admin/despacho", keywords: "asignar programar" },
          { id: "map", label: "Mapa de entregas", icon: MapIcon, href: "/admin/despacho/mapa", requires: "/admin/despacho", keywords: "ubicar pines rutas choferes" },
          { id: "sheets", label: "Hojas de ruta de hoy", icon: Printer, href: "/admin/despacho/hoja", requires: "/admin/despacho", keywords: "imprimir" },
          { id: "driver", label: "Vista chofer", icon: Smartphone, href: "/admin/despacho/chofer", requires: "/admin/despacho", keywords: "movil entregas" },
          { id: "due", label: "Clientes por reponer", icon: BellRing, href: "/admin/recordatorios", requires: "/admin/recordatorios", keywords: "whatsapp recordatorio" },
          { id: "colors", label: "Cambiar colores y logos", icon: Paintbrush, href: "/admin/apariencia", keywords: "apariencia tema marca" },
        ];
  return [
    ...list.filter((a) => !a.requires || !hidden.has(a.requires)),
    { id: "site", label: siteLabel, icon: Store, href: siteHref, external: true, keywords: "tienda sitio web" },
    { id: "logout", label: "Cerrar sesión", icon: LogOut, run: "logout", keywords: "salir" },
  ];
}

const TONE_DOT: Record<NonNullable<AdminNotification["tone"]>, string> = {
  info: "bg-[var(--brand)]",
  warning: "bg-amber-500",
  danger: "bg-red-500",
};

function Notifications({ items }: { items: AdminNotification[] }) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const ref = useDismiss(open, close);
  const total = items.reduce((n, i) => n + i.count, 0);
  const menuId = useId();

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={total ? `Notificaciones: ${total} pendientes` : "Notificaciones"}
        onClick={() => setOpen((o) => !o)}
        className="relative grid size-9 place-items-center rounded-lg border border-[#d5e3ec] bg-white text-[#3d4a5c] hover:bg-[#f4f8fb] focus-visible:outline-2 focus-visible:outline-[var(--brand)]"
      >
        <Bell aria-hidden className="size-[18px]" />
        {total ? (
          <span className="absolute -right-1 -top-1 min-w-[18px] rounded-full bg-red-500 px-1 text-center text-[10px] font-bold leading-[18px] text-white">
            {total > 99 ? "99+" : total}
          </span>
        ) : null}
      </button>
      {open ? (
        <div
          id={menuId}
          className="absolute right-0 top-11 z-50 w-72 rounded-xl border border-[#d5e3ec] bg-white shadow-xl"
        >
          <p className="border-b border-[#e8f0f5] px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] text-[#5a6578]">
            Notificaciones
          </p>
          {items.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-[#5a6578]">Todo al día.</p>
          ) : (
            <ul className="p-1.5">
              {items.map((n) => (
                <li key={n.id}>
                  <Link
                    href={n.href}
                    onClick={close}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-[#3d4a5c] hover:bg-[#f4f8fb]"
                  >
                    <span aria-hidden className={`size-2 rounded-full ${TONE_DOT[n.tone ?? "info"]}`} />
                    <span className="flex-1">{n.label}</span>
                    <span className="rounded-full bg-[#eef3f7] px-2 py-0.5 text-xs font-semibold tabular-nums text-[var(--brand-deep)]">
                      {n.count}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}

function UserMenu({
  email,
  roleLabel,
  orgName,
  siteHref,
  siteLabel,
}: Pick<Props, "email" | "roleLabel" | "orgName" | "siteHref" | "siteLabel">) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const ref = useDismiss(open, close);
  const menuId = useId();

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2.5 rounded-lg py-1 pl-1 pr-2 hover:bg-[#f4f8fb] focus-visible:outline-2 focus-visible:outline-[var(--brand)]"
      >
        <span
          aria-hidden
          className="grid size-8 place-items-center rounded-full bg-[var(--brand-deep)] text-xs font-bold text-white"
        >
          {initials(email)}
        </span>
        <span className="hidden text-left leading-tight md:block">
          <span className="block max-w-[180px] truncate text-sm font-semibold text-[var(--admin-topbar-text)]">
            {email}
          </span>
          <span className="block text-[11px] text-[var(--admin-topbar-text)] opacity-70">{roleLabel}</span>
        </span>
        <ChevronDown aria-hidden className="hidden size-4 text-[#7b8aa0] md:block" />
        <span className="sr-only">Menú de usuario</span>
      </button>
      {open ? (
        <div
          id={menuId}
          className="absolute right-0 top-12 z-50 w-64 rounded-xl border border-[#d5e3ec] bg-white p-1.5 shadow-xl"
        >
          <div className="px-3 py-2">
            <p className="truncate text-sm font-semibold text-[#12233d]">{orgName}</p>
            <p className="truncate text-xs text-[#5a6578]">{email}</p>
          </div>
          <div className="my-1 h-px bg-[#e8f0f5]" />
          <a
            href={siteHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-[#3d4a5c] hover:bg-[#f4f8fb]"
          >
            <ExternalLink aria-hidden className="size-4" />
            {siteLabel}
          </a>
          <form action={logoutAction}>
            <ConfirmSubmitButton
              confirmTitle="¿Cerrar sesión?"
              confirmText="Tendrás que volver a ingresar para administrar el panel."
              confirmLabel="Cerrar sesión"
              tone="primary"
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-red-700 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-[var(--brand)] [&>svg]:size-4"
            >
              <LogOut aria-hidden className="size-4" />
              Cerrar sesión
            </ConfirmSubmitButton>
          </form>
        </div>
      ) : null}
    </div>
  );
}

function Brand({
  orgName,
  orgSubtitle,
  orgLogoUrl,
  variant,
  collapsed,
}: {
  orgName: string;
  orgSubtitle?: string;
  orgLogoUrl?: string;
  variant: Props["variant"];
  collapsed: boolean;
}) {
  return (
    <Link
      href={variant === "platform" ? "/admin/plataforma" : "/admin"}
      className={`flex items-center gap-2.5 ${collapsed ? "justify-center" : ""}`}
    >
      {orgLogoUrl && variant === "tenant" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={orgLogoUrl}
          alt=""
          className="size-9 shrink-0 rounded-xl bg-white object-contain p-0.5"
        />
      ) : (
        <span
          aria-hidden
          className="grid size-9 shrink-0 place-items-center rounded-xl bg-[linear-gradient(135deg,#00b1e2,#0a6fb0)] text-sm font-black text-white shadow-[0_6px_16px_-6px_rgba(0,177,226,0.8)]"
        >
          {variant === "platform" ? "Mi" : initials(orgName)}
        </span>
      )}
      <span className={collapsed ? "sr-only" : "min-w-0 leading-tight text-[var(--admin-sidebar-text)]"}>
        <span className="block truncate text-[15px] font-bold brightness-125">
          {variant === "platform" ? "MiBidón" : orgName}
        </span>
        <span className="block truncate text-[11px] opacity-70">
          {variant === "platform" ? "Plataforma" : orgSubtitle || "Panel de empresa"}
        </span>
      </span>
    </Link>
  );
}

export function AdminShell({
  variant,
  orgName,
  orgSubtitle,
  orgLogoUrl,
  email,
  roleLabel,
  siteHref,
  siteLabel,
  notifications,
  hiddenHrefs,
  year,
  children,
}: Props) {
  const pathname = usePathname() ?? "";
  const hiddenKey = (hiddenHrefs ?? []).join("|");
  const groups = useMemo(() => {
    const base = variant === "platform" ? PLATFORM_NAV : TENANT_NAV;
    const hidden = new Set(hiddenKey ? hiddenKey.split("|") : []);
    return base
      .map((g) => ({ ...g, items: g.items.filter((i) => !hidden.has(i.href)) }))
      .filter((g) => g.items.length > 0);
  }, [variant, hiddenKey]);
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const paletteReturnFocus = useRef<HTMLElement | null>(null);
  const reduceMotion = useReducedMotion();
  const actions = useMemo(
    () => buildActions(variant, new Set(hiddenKey ? hiddenKey.split("|") : []), siteHref, siteLabel),
    [variant, hiddenKey, siteHref, siteLabel],
  );

  const openPalette = useCallback(() => {
    paletteReturnFocus.current = document.activeElement as HTMLElement | null;
    setPaletteOpen(true);
  }, []);
  const closePalette = useCallback(() => {
    setPaletteOpen(false);
    paletteReturnFocus.current?.focus?.();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (paletteOpen) closePalette();
        else openPalette();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [paletteOpen, openPalette, closePalette]);

  useEffect(() => {
    if (window.localStorage.getItem(COLLAPSE_KEY) === "1") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate persisted preference after mount
      setCollapsed(true);
    }
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((c) => {
      window.localStorage.setItem(COLLAPSE_KEY, c ? "0" : "1");
      return !c;
    });
  };

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!drawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const first = drawerRef.current?.querySelector<HTMLElement>("a,button");
    first?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDrawer();
      if (e.key === "Tab" && drawerRef.current) {
        const nodes = drawerRef.current.querySelectorAll<HTMLElement>(
          'a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])',
        );
        const list = Array.from(nodes).filter((n) => n.offsetParent !== null);
        if (!list.length) return;
        const firstEl = list[0];
        const lastEl = list[list.length - 1];
        if (e.shiftKey && document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        } else if (!e.shiftKey && document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [drawerOpen, closeDrawer]);

  return (
    <div
      className="min-h-screen bg-[#f2f6f9] text-[#12233d] print:bg-white"
      style={{ "--admin-sidebar-w": collapsed ? "72px" : "256px" } as CSSProperties}
    >
      <a
        href="#admin-main"
        className="sr-only z-[60] rounded-md bg-white print:hidden px-3 py-2 text-sm font-semibold focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
      >
        Saltar al contenido
      </a>

      <aside
        aria-label="Barra lateral"
        className={`fixed inset-y-0 left-0 z-30 hidden flex-col [background:var(--admin-sidebar-fill)] transition-[width] duration-200 lg:flex print:!hidden ${
          collapsed ? "w-[72px]" : "w-64"
        }`}
      >
        <div className={`flex h-16 items-center border-b border-white/8 ${collapsed ? "px-3" : "px-5"}`}>
          <Brand orgName={orgName} orgSubtitle={orgSubtitle} orgLogoUrl={orgLogoUrl} variant={variant} collapsed={collapsed} />
        </div>
        <SidebarNav groups={groups} pathname={pathname} collapsed={collapsed} />
        <div className="border-t border-white/8 p-3">
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Expandir barra lateral" : "Contraer barra lateral"}
            className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-sm text-[var(--admin-sidebar-text)] opacity-80 hover:bg-[var(--admin-hover-bg)] hover:opacity-100 focus-visible:outline-2 focus-visible:outline-[var(--brand)] ${
              collapsed ? "justify-center" : ""
            }`}
          >
            {collapsed ? (
              <PanelLeftOpen aria-hidden className="size-[18px]" />
            ) : (
              <>
                <PanelLeftClose aria-hidden className="size-[18px]" />
                Contraer
              </>
            )}
          </button>
        </div>
      </aside>

      <AnimatePresence>
      {drawerOpen ? (
        <motion.div key="drawer" className="fixed inset-0 z-50 lg:hidden" exit={{ opacity: 1 }} transition={{ duration: reduceMotion ? 0 : 0.2 }}>
          <motion.div
            aria-hidden
            onClick={closeDrawer}
            className="absolute inset-0 bg-[#06142a]/60 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.2 }}
          />
          <motion.div
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Menú de navegación"
            className="absolute inset-y-0 left-0 flex w-[min(84vw,300px)] flex-col [background:var(--admin-sidebar-fill)] shadow-2xl"
            initial={reduceMotion ? false : { x: "-100%" }}
            animate={{ x: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { x: "-100%" }}
            transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 40 }}
            drag={reduceMotion ? false : "x"}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={{ left: 0.6, right: 0 }}
            onDragEnd={(_, info) => {
              if (info.offset.x < -80 || info.velocity.x < -400) closeDrawer();
            }}
          >
            <div className="flex h-16 items-center justify-between border-b border-white/8 px-5">
              <Brand orgName={orgName} orgSubtitle={orgSubtitle} orgLogoUrl={orgLogoUrl} variant={variant} collapsed={false} />
              <button
                type="button"
                onClick={closeDrawer}
                aria-label="Cerrar menú"
                className="grid size-9 place-items-center rounded-lg text-[var(--admin-sidebar-text)] hover:bg-[var(--admin-hover-bg)]"
              >
                <X aria-hidden className="size-5" />
              </button>
            </div>
            <SidebarNav
              groups={groups}
              pathname={pathname}
              collapsed={false}
              onNavigate={() => setDrawerOpen(false)}
            />
          </motion.div>
        </motion.div>
      ) : null}
      </AnimatePresence>

      <CommandPalette
        open={paletteOpen}
        onClose={closePalette}
        groups={groups}
        icons={ICONS}
        actions={actions}
        searchTargets={
          variant === "platform"
            ? [{ label: "Buscar empresas", href: "/admin/plataforma/empresas", icon: Building2 }]
            : [
                { label: "Buscar pedidos", href: "/admin/pedidos", icon: ClipboardList },
                { label: "Buscar productos", href: "/admin/productos", icon: Package },
              ]
        }
      />
      <Suspense fallback={null}>
        <FlashToaster />
      </Suspense>

      <div className={`transition-[padding] duration-200 print:!pl-0 ${collapsed ? "lg:pl-[72px]" : "lg:pl-64"}`}>
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-[#dde7ee] bg-[var(--admin-topbar-bg)]/95 text-[var(--admin-topbar-text)] px-4 backdrop-blur sm:px-6 print:hidden">
          <button
            ref={triggerRef}
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Abrir menú"
            aria-expanded={drawerOpen}
            className="grid size-9 place-items-center rounded-lg border border-[#d5e3ec] text-[#3d4a5c] hover:bg-[#f4f8fb] lg:hidden"
          >
            <Menu aria-hidden className="size-5" />
          </button>
          <div className="flex min-w-0 flex-1 justify-end sm:justify-start">
            <PaletteTrigger onOpen={openPalette} />
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Notifications items={notifications} />
            <UserMenu
              email={email}
              roleLabel={roleLabel}
              orgName={orgName}
              siteHref={siteHref}
              siteLabel={siteLabel}
            />
          </div>
        </header>
        <main id="admin-main" tabIndex={-1} className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 print:max-w-none print:p-0">
          {children}
        </main>
        <footer className="mx-auto max-w-[1400px] px-4 pb-8 text-xs text-[#7b8aa0] sm:px-6 lg:px-8 print:hidden">
          © {year} MiBidón · Plataforma para empresas de agua purificada.
        </footer>
      </div>
    </div>
  );
}
