"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
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
  Menu,
  Package,
  Palette,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Recycle,
  Search,
  Store,
  Truck,
  X,
  type LucideIcon,
} from "lucide-react";
import { logoutAction } from "@/app/admin/actions";
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
  orders: ClipboardList,
  reminders: BellRing,
  containers: Recycle,
  products: Package,
  brand: Palette,
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
  email: string;
  roleLabel: string;
  siteHref: string;
  siteLabel: string;
  notifications: AdminNotification[];
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
                className="flex w-full items-center justify-between rounded-md px-2.5 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8fb3d1] hover:text-white focus-visible:outline-2 focus-visible:outline-[var(--brand)]"
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
          ? "bg-[var(--brand)] text-white shadow-[0_6px_18px_-8px_rgba(0,177,226,0.9)]"
          : "text-[#c9dcec] hover:bg-white/8 hover:text-white"
      }`}
    >
      <Icon aria-hidden className="size-[18px] shrink-0" />
      <span className={collapsed ? "sr-only" : "truncate"}>{item.label}</span>
    </Link>
  );
}

function QuickSearch({ groups }: { groups: AdminNavGroup[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const close = useCallback(() => setOpen(false), []);
  const wrapRef = useDismiss(open, close);

  const items = useMemo(() => {
    const flat = groups.flatMap((g) => g.items.map((i) => ({ ...i, group: g.label })));
    const needle = q
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    if (!needle) return flat;
    return flat.filter((i) =>
      `${i.label} ${i.group}`
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .includes(needle),
    );
  }, [groups, q]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const go = (href: string) => {
    setOpen(false);
    setQ("");
    inputRef.current?.blur();
    router.push(href);
  };

  return (
    <div ref={wrapRef} className="relative w-full max-w-md">
      <label htmlFor={`${listId}-input`} className="sr-only">
        Buscar sección del panel
      </label>
      <Search
        aria-hidden
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#7b8aa0]"
      />
      <input
        ref={inputRef}
        id={`${listId}-input`}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open && items[active] ? `${listId}-${active}` : undefined}
        value={q}
        placeholder="Buscar sección…"
        onChange={(e) => {
          setQ(e.target.value);
          setActive(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((a) => Math.min(a + 1, items.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((a) => Math.max(a - 1, 0));
          } else if (e.key === "Enter" && items[active]) {
            e.preventDefault();
            go(items[active].href);
          }
        }}
        className="h-9 w-full rounded-lg border border-[#d5e3ec] bg-[#f4f8fb] pl-9 pr-14 text-sm text-[#12233d] placeholder:text-[#7b8aa0] focus:border-[var(--brand)] focus:bg-white focus:outline-none focus:ring-3 focus:ring-[var(--brand)]/20"
      />
      <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded border border-[#d5e3ec] bg-white px-1.5 py-0.5 font-mono text-[10px] text-[#7b8aa0] sm:block">
        Ctrl K
      </kbd>
      {open ? (
        <ul
          id={listId}
          role="listbox"
          aria-label="Secciones"
          className="absolute left-0 right-0 top-11 z-50 max-h-80 overflow-y-auto rounded-xl border border-[#d5e3ec] bg-white p-1.5 shadow-xl"
        >
          {items.length === 0 ? (
            <li className="px-3 py-2 text-sm text-[#5a6578]">Sin resultados</li>
          ) : (
            items.map((item, i) => {
              const Icon = ICONS[item.icon];
              return (
                <li
                  key={item.href}
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={i === active}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    go(item.href);
                  }}
                  onMouseEnter={() => setActive(i)}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm ${
                    i === active ? "bg-[#e8f7fc] text-[var(--brand-deep)]" : "text-[#3d4a5c]"
                  }`}
                >
                  <Icon aria-hidden className="size-4 text-[var(--brand)]" />
                  <span className="flex-1">{item.label}</span>
                  <span className="text-[11px] text-[#8a96a6]">{item.group}</span>
                </li>
              );
            })
          )}
        </ul>
      ) : null}
    </div>
  );
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
          <span className="block max-w-[180px] truncate text-sm font-semibold text-[#12233d]">
            {email}
          </span>
          <span className="block text-[11px] text-[#5a6578]">{roleLabel}</span>
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
            <button
              type="submit"
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-red-700 hover:bg-red-50"
            >
              <LogOut aria-hidden className="size-4" />
              Cerrar sesión
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}

function Brand({ orgName, variant, collapsed }: { orgName: string; variant: Props["variant"]; collapsed: boolean }) {
  return (
    <Link
      href={variant === "platform" ? "/admin/plataforma" : "/admin"}
      className={`flex items-center gap-2.5 ${collapsed ? "justify-center" : ""}`}
    >
      <span
        aria-hidden
        className="grid size-9 shrink-0 place-items-center rounded-xl bg-[linear-gradient(135deg,#00b1e2,#0a6fb0)] text-sm font-black text-white shadow-[0_6px_16px_-6px_rgba(0,177,226,0.8)]"
      >
        {variant === "platform" ? "Mi" : initials(orgName)}
      </span>
      <span className={collapsed ? "sr-only" : "min-w-0 leading-tight"}>
        <span className="block truncate text-[15px] font-bold text-white">
          {variant === "platform" ? "MiBidón" : orgName}
        </span>
        <span className="block text-[11px] text-[#8fb3d1]">
          {variant === "platform" ? "Plataforma" : "Panel de empresa"}
        </span>
      </span>
    </Link>
  );
}

export function AdminShell({
  variant,
  orgName,
  email,
  roleLabel,
  siteHref,
  siteLabel,
  notifications,
  children,
}: Props) {
  const pathname = usePathname() ?? "";
  const groups = variant === "platform" ? PLATFORM_NAV : TENANT_NAV;
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

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
    <div className="min-h-screen bg-[#f2f6f9] text-[#12233d]">
      <a
        href="#admin-main"
        className="sr-only z-[60] rounded-md bg-white px-3 py-2 text-sm font-semibold focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
      >
        Saltar al contenido
      </a>

      <aside
        aria-label="Barra lateral"
        className={`fixed inset-y-0 left-0 z-30 hidden flex-col bg-[#0b1f3a] transition-[width] duration-200 lg:flex ${
          collapsed ? "w-[72px]" : "w-64"
        }`}
      >
        <div className={`flex h-16 items-center border-b border-white/8 ${collapsed ? "px-3" : "px-5"}`}>
          <Brand orgName={orgName} variant={variant} collapsed={collapsed} />
        </div>
        <SidebarNav groups={groups} pathname={pathname} collapsed={collapsed} />
        <div className="border-t border-white/8 p-3">
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Expandir barra lateral" : "Contraer barra lateral"}
            className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-sm text-[#8fb3d1] hover:bg-white/8 hover:text-white focus-visible:outline-2 focus-visible:outline-[var(--brand)] ${
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

      {drawerOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            aria-hidden
            onClick={closeDrawer}
            className="absolute inset-0 bg-[#06142a]/60 backdrop-blur-[2px]"
          />
          <div
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Menú de navegación"
            className="absolute inset-y-0 left-0 flex w-[min(84vw,300px)] flex-col bg-[#0b1f3a] shadow-2xl"
          >
            <div className="flex h-16 items-center justify-between border-b border-white/8 px-5">
              <Brand orgName={orgName} variant={variant} collapsed={false} />
              <button
                type="button"
                onClick={closeDrawer}
                aria-label="Cerrar menú"
                className="grid size-9 place-items-center rounded-lg text-[#c9dcec] hover:bg-white/10"
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
          </div>
        </div>
      ) : null}

      <div className={`transition-[padding] duration-200 ${collapsed ? "lg:pl-[72px]" : "lg:pl-64"}`}>
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-[#dde7ee] bg-white/95 px-4 backdrop-blur sm:px-6">
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
          <div className="min-w-0 flex-1">
            <QuickSearch groups={groups} />
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
        <main id="admin-main" tabIndex={-1} className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
        <footer className="mx-auto max-w-[1400px] px-4 pb-8 text-xs text-[#7b8aa0] sm:px-6 lg:px-8">
          © {new Date().getFullYear()} MiBidón · Plataforma para empresas de agua purificada.
        </footer>
      </div>
    </div>
  );
}
