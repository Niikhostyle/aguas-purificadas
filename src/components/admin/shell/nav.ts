export type AdminNavIcon =
  | "dashboard"
  | "dispatch"
  | "map"
  | "orders"
  | "reminders"
  | "containers"
  | "products"
  | "discounts"
  | "brand"
  | "appearance"
  | "modules"
  | "tenants"
  | "newTenant"
  | "landing"
  | "store";

export type AdminNavItem = {
  href: string;
  label: string;
  icon: AdminNavIcon;
  /** Extra path prefixes that should mark this item as active. */
  match?: string[];
  /** Exact match only (dashboards, whose href is a prefix of everything). */
  exact?: boolean;
  activeWhen?: (pathname: string) => boolean;
};

export type AdminNavGroup = {
  label: string;
  items: AdminNavItem[];
};

export const TENANT_NAV: AdminNavGroup[] = [
  {
    label: "Operación",
    items: [
      { href: "/admin", label: "Dashboard", icon: "dashboard", exact: true },
      {
        href: "/admin/despacho",
        label: "Despacho",
        icon: "dispatch",
        activeWhen: (pathname) =>
          pathname.startsWith("/admin/despacho") && !pathname.startsWith("/admin/despacho/mapa"),
      },
      { href: "/admin/despacho/mapa", label: "Mapa de entregas", icon: "map" },
      { href: "/admin/pedidos", label: "Pedidos", icon: "orders" },
      { href: "/admin/recordatorios", label: "Recordatorios", icon: "reminders" },
      { href: "/admin/envases", label: "Envases", icon: "containers" },
    ],
  },
  {
    label: "Catálogo",
    items: [
      { href: "/admin/productos", label: "Productos", icon: "products" },
      { href: "/admin/descuentos", label: "Descuentos", icon: "discounts" },
    ],
  },
  {
    label: "Configuración",
    items: [
      { href: "/admin/apariencia", label: "Apariencia", icon: "appearance" },
      { href: "/admin/marca", label: "Marca y contenido", icon: "brand" },
      { href: "/admin/modulos", label: "Módulos", icon: "modules" },
    ],
  },
];

export const PLATFORM_NAV: AdminNavGroup[] = [
  {
    label: "General",
    items: [
      { href: "/admin/plataforma", label: "Dashboard", icon: "dashboard", exact: true },
    ],
  },
  {
    label: "Clientes",
    items: [
      {
        href: "/admin/plataforma/empresas",
        label: "Empresas",
        icon: "tenants",
        activeWhen: (pathname) => {
          const rest = pathname.replace(/^\/admin\/plataforma\/?/, "").split("/")[0];
          return rest !== "" && !["nueva", "landing"].includes(rest);
        },
      },
      { href: "/admin/plataforma/nueva", label: "Nueva empresa", icon: "newTenant" },
    ],
  },
  {
    label: "Sitio mibidon.cl",
    items: [
      { href: "/admin/plataforma/landing", label: "Landing CMS", icon: "landing" },
    ],
  },
];

export function isNavItemActive(item: AdminNavItem, pathname: string) {
  if (item.activeWhen) return item.activeWhen(pathname) || pathname === item.href;
  if (item.exact) return pathname === item.href;
  const prefixes = [item.href, ...(item.match ?? [])];
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}
