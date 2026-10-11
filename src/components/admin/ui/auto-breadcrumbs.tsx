"use client";

import { usePathname } from "next/navigation";
import { PLATFORM_NAV, TENANT_NAV } from "../shell/nav";
import { Breadcrumbs, type Crumb } from "./page-header";

const GROUP_BY_HREF = new Map<string, { group: string; label: string }>(
  [...TENANT_NAV, ...PLATFORM_NAV].flatMap((g) =>
    g.items.map((i) => [i.href, { group: g.label, label: i.label }] as const),
  ),
);

const SEGMENT_LABEL: Record<string, string> = {
  chofer: "Vista chofer",
  hoja: "Hoja de ruta",
  nuevo: "Nuevo",
  nueva: "Nueva",
};

/** Breadcrumbs derived from the URL, for pages that don't pass explicit crumbs. */
export function AutoBreadcrumbs() {
  const pathname = usePathname() ?? "/admin";
  const platform = pathname.startsWith("/admin/plataforma");
  const home = platform ? "/admin/plataforma" : "/admin";
  const parts = pathname.replace(/^\/admin\/?/, "").split("/").filter(Boolean);
  const crumbs: Crumb[] = [];

  let href = "/admin";
  parts.forEach((part, i) => {
    href += `/${part}`;
    const known = GROUP_BY_HREF.get(href);
    if (i === 0 && known && !platform) crumbs.push({ label: known.group });
    if (known && !(platform && href === home)) {
      crumbs.push({ label: known.label, href });
    } else if (!known) {
      crumbs.push({ label: SEGMENT_LABEL[part] ?? (i === parts.length - 1 ? "Detalle" : part), href });
    }
  });
  if (crumbs.length === 0) crumbs.push({ label: "Dashboard" });

  return <Breadcrumbs items={crumbs} homeHref={home} />;
}
