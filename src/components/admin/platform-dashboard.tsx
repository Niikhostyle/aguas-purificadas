"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { setTenantActiveAction } from "@/app/admin/(panel)/plataforma/manage-actions";

export type PlatformTenantRow = {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  city: string | null;
  region: string | null;
  products: number;
  orders: number;
  admins: number;
  webpay: "integration" | "production" | null;
  createdAt: string;
};

export type PlatformStats = {
  empresas: number;
  activas: number;
  suspendidas: number;
  productos: number;
  pedidos: number;
  webpayConfigurados: number;
  adminsEmpresa: number;
};

type Props = {
  stats: PlatformStats;
  tenants: PlatformTenantRow[];
};

function storefrontHref(slug: string) {
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host.endsWith("mibidon.cl") || host === "mibidon.cl") {
      return `https://${slug}.mibidon.cl/`;
    }
  }
  return `/?tenant=${slug}`;
}

export function PlatformDashboard({ stats, tenants }: Props) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "suspended">("all");
  const [webpay, setWebpay] = useState<"all" | "yes" | "no">("all");
  const deferredQ = useDeferredValue(q);

  const filtered = useMemo(() => {
    const needle = deferredQ.trim().toLowerCase();
    return tenants.filter((t) => {
      if (status === "active" && !t.active) return false;
      if (status === "suspended" && t.active) return false;
      if (webpay === "yes" && !t.webpay) return false;
      if (webpay === "no" && t.webpay) return false;
      if (!needle) return true;
      return (
        t.name.toLowerCase().includes(needle) ||
        t.slug.toLowerCase().includes(needle) ||
        (t.city || "").toLowerCase().includes(needle) ||
        (t.region || "").toLowerCase().includes(needle)
      );
    });
  }, [tenants, deferredQ, status, webpay]);

  const statCards = [
    {
      label: "Empresas",
      value: stats.empresas,
      hint: "Tenants activos en la plataforma",
    },
    {
      label: "Activas",
      value: stats.activas,
      hint: "Tiendas publicadas",
      tone: "ok" as const,
    },
    {
      label: "Suspendidas",
      value: stats.suspendidas,
      hint: "Sin acceso público",
      tone: "warn" as const,
    },
    {
      label: "Productos",
      value: stats.productos,
      hint: "En todos los catálogos",
    },
    {
      label: "Pedidos",
      value: stats.pedidos,
      hint: "Histórico multi-empresa",
    },
    {
      label: "WebPay",
      value: stats.webpayConfigurados,
      hint: "Credenciales activas",
    },
  ];

  return (
    <div className="platform-dash space-y-8">
      <header className="platform-dash__enter flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--brand)]">
            MiBidón · operación
          </p>
          <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl text-[var(--brand-deep)] md:text-4xl">
            Panel de empresas
          </h1>
          <p className="mt-2 max-w-xl text-sm text-[#5a6578]">
            Supervisá tenants, salud de catálogo y WebPay. El día a día de cada
            tienda lo opera el admin de la empresa.
          </p>
        </div>
        <Link
          href="/admin/plataforma/nueva"
          className="inline-flex h-10 items-center rounded-lg bg-[var(--brand)] px-4 text-sm font-bold uppercase tracking-wide text-white shadow-sm shadow-[#00b1e2]/25 transition hover:-translate-y-0.5 hover:bg-[var(--brand-deep)]"
        >
          Nueva empresa
        </Link>
      </header>

      <section
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
        aria-label="Estadísticas"
      >
        {statCards.map((card, i) => (
          <article
            key={card.label}
            className="platform-dash__card group rounded-2xl border border-[#d5e3ec] bg-white p-4 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[var(--brand)] hover:shadow-md hover:shadow-[#00b1e2]/12"
            style={{ animationDelay: `${80 + i * 45}ms` }}
          >
            <p className="text-[11px] font-bold uppercase tracking-wide text-[#5a6578]">
              {card.label}
            </p>
            <p
              className={`mt-2 font-[family-name:var(--font-display)] text-3xl tabular-nums ${
                card.tone === "ok"
                  ? "text-emerald-700"
                  : card.tone === "warn"
                    ? "text-amber-700"
                    : "text-[var(--brand-deep)]"
              }`}
            >
              {card.value}
            </p>
            <p className="mt-1 text-xs text-[#7a8699]">{card.hint}</p>
          </article>
        ))}
      </section>

      <section className="platform-dash__enter rounded-2xl border border-[#d5e3ec] bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-[#e8f0f5] p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wide text-[var(--brand-deep)]">
              Empresas
            </h2>
            <p className="text-xs text-[#5a6578]">
              {filtered.length} de {tenants.length} visibles
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por nombre, slug o ciudad…"
              className="sm:w-64"
              aria-label="Buscar empresas"
            />
            <select
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as "all" | "active" | "suspended")
              }
              className="h-9 rounded-lg border border-[#d5e3ec] bg-white px-3 text-sm text-[var(--brand-deep)]"
              aria-label="Filtrar por estado"
            >
              <option value="all">Todos los estados</option>
              <option value="active">Solo activas</option>
              <option value="suspended">Solo suspendidas</option>
            </select>
            <select
              value={webpay}
              onChange={(e) => setWebpay(e.target.value as "all" | "yes" | "no")}
              className="h-9 rounded-lg border border-[#d5e3ec] bg-white px-3 text-sm text-[var(--brand-deep)]"
              aria-label="Filtrar WebPay"
            >
              <option value="all">WebPay: todos</option>
              <option value="yes">Con WebPay</option>
              <option value="no">Sin WebPay</option>
            </select>
          </div>
        </div>

        {tenants.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="font-[family-name:var(--font-display)] text-2xl text-[var(--brand-deep)]">
              Todavía no hay empresas
            </p>
            <p className="mx-auto mt-2 max-w-md text-sm text-[#5a6578]">
              Creá el primer tenant con slug; quedará disponible en{" "}
              <code className="text-[var(--brand)]">slug.mibidon.cl</code>.
            </p>
            <Link
              href="/admin/plataforma/nueva"
              className="mt-6 inline-flex h-10 items-center rounded-lg bg-[var(--brand-deep)] px-4 text-sm font-bold uppercase text-white hover:bg-[var(--brand)]"
            >
              Crear primera empresa
            </Link>
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-[#5a6578]">
            No hay resultados con esos filtros.{" "}
            <button
              type="button"
              className="font-semibold text-[var(--brand)] hover:underline"
              onClick={() => {
                setQ("");
                setStatus("all");
                setWebpay("all");
              }}
            >
              Limpiar filtros
            </button>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#f7fbfd] text-xs uppercase tracking-wide text-[#5a6578]">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Empresa</th>
                    <th className="px-4 py-3 font-semibold">Slug</th>
                    <th className="px-4 py-3 font-semibold">Catálogo</th>
                    <th className="px-4 py-3 font-semibold">WebPay</th>
                    <th className="px-4 py-3 font-semibold">Estado</th>
                    <th className="px-4 py-3 text-right font-semibold">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((t, i) => (
                    <tr
                      key={t.id}
                      className="platform-dash__row border-t border-[#e8f0f5] transition hover:bg-[#e8f7fc]/60"
                      style={{ animationDelay: `${40 + i * 35}ms` }}
                    >
                      <td className="px-4 py-3">
                        <p className="font-semibold text-[var(--brand-deep)]">
                          {t.name}
                        </p>
                        <p className="text-xs text-[#5a6578]">
                          {[t.city, t.region].filter(Boolean).join(" · ") ||
                            "Sin ubicación"}{" "}
                          · {t.admins} admin
                          {t.admins === 1 ? "" : "s"}
                        </p>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-[#3d4a5c]">
                        {t.slug}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-[#3d4a5c]">
                        {t.products} prod. · {t.orders} ped.
                      </td>
                      <td className="px-4 py-3">
                        {t.webpay ? (
                          <Badge className="bg-[#e8f7fc] text-[var(--brand-deep)] hover:bg-[#e8f7fc]">
                            {t.webpay === "production"
                              ? "Producción"
                              : "Sandbox"}
                          </Badge>
                        ) : (
                          <span className="text-xs text-[#9aa6b5]">
                            Sin configurar
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          className={
                            t.active
                              ? "bg-emerald-50 text-emerald-800 hover:bg-emerald-50"
                              : "bg-amber-50 text-amber-800 hover:bg-amber-50"
                          }
                        >
                          {t.active ? "Activa" : "Suspendida"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <Link
                            href={`/admin/plataforma/${t.id}`}
                            className="text-sm font-semibold text-[var(--brand)] hover:underline"
                          >
                            Gestionar
                          </Link>
                          <a
                            href={storefrontHref(t.slug)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-[#5a6578] hover:text-[var(--brand)] hover:underline"
                          >
                            Tienda
                          </a>
                          <form action={setTenantActiveAction}>
                            <input type="hidden" name="tenantId" value={t.id} />
                            <input
                              type="hidden"
                              name="active"
                              value={t.active ? "0" : "1"}
                            />
                            <Button
                              type="submit"
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs"
                            >
                              {t.active ? "Suspender" : "Activar"}
                            </Button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <ul className="space-y-3 p-4 md:hidden">
              {filtered.map((t, i) => (
                <li
                  key={t.id}
                  className="platform-dash__row rounded-xl border border-[#e8f0f5] p-4"
                  style={{ animationDelay: `${40 + i * 35}ms` }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-[var(--brand-deep)]">
                        {t.name}
                      </p>
                      <p className="font-mono text-xs text-[#5a6578]">
                        {t.slug}
                      </p>
                    </div>
                    <Badge
                      className={
                        t.active
                          ? "bg-emerald-50 text-emerald-800"
                          : "bg-amber-50 text-amber-800"
                      }
                    >
                      {t.active ? "Activa" : "Suspendida"}
                    </Badge>
                  </div>
                  <p className="mt-2 text-xs text-[#5a6578]">
                    {t.products} productos · {t.orders} pedidos ·{" "}
                    {t.webpay
                      ? `WebPay ${t.webpay === "production" ? "prod" : "sandbox"}`
                      : "Sin WebPay"}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-3">
                    <Link
                      href={`/admin/plataforma/${t.id}`}
                      className="text-sm font-semibold text-[var(--brand)]"
                    >
                      Gestionar
                    </Link>
                    <a
                      href={storefrontHref(t.slug)}
                      className="text-sm text-[#5a6578]"
                    >
                      Tienda
                    </a>
                    <form action={setTenantActiveAction}>
                      <input type="hidden" name="tenantId" value={t.id} />
                      <input
                        type="hidden"
                        name="active"
                        value={t.active ? "0" : "1"}
                      />
                      <button
                        type="submit"
                        className="text-sm font-semibold text-[var(--brand-deep)]"
                      >
                        {t.active ? "Suspender" : "Activar"}
                      </button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}
