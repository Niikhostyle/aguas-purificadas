import { ArrowDownLeft, ArrowUpRight, MessageCircle, Package, PackageCheck, PackageOpen, UserX } from "lucide-react";
import { addBottleMovementAction } from "./actions";
import { ListQuickFilter } from "@/components/admin/dispatch-client";
import { EmptyState } from "@/components/admin/ui";
import { Flash, ModuleDisabled, PageHeader, Pill, StatCard, btn, field } from "@/components/admin/dispatch-ui";
import { prisma } from "@/lib/db";
import { customerWhatsappHref, formatDateTimeCl, shortRef, startOfDayCl, todayCl, addDaysStr } from "@/lib/dispatch";
import { bottleBalances } from "@/lib/dispatch-server";
import { requireTenantModule } from "@/lib/tenant-admin";
import { cn } from "@/lib/utils";

const REASON_LABEL: Record<string, string> = {
  entrega: "Entrega",
  devolucion: "Devolución",
  ajuste: "Ajuste",
};

export default async function BottlesPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { admin, tenantId, enabled } = await requireTenantModule("envases");
  if (!enabled) return <ModuleDisabled name="Envases retornables" />;
  const sp = await searchParams;

  const since = startOfDayCl(addDaysStr(todayCl(), -30));
  const [balances, customers, recent, last30] = await Promise.all([
    bottleBalances(tenantId),
    prisma.deliveryCustomer.findMany({
      where: { tenantId },
      select: { id: true, name: true, phone: true, commune: true, address: true, lastDeliveredAt: true },
      orderBy: { name: "asc" },
    }),
    prisma.bottleMovement.findMany({
      where: { tenantId },
      include: { customer: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 25,
    }),
    prisma.bottleMovement.groupBy({
      by: ["direction"],
      where: { tenantId, createdAt: { gte: since } },
      _sum: { quantity: true },
    }),
  ]);

  const rows = customers
    .map((c) => ({ ...c, ...(balances.get(c.id) ?? { out: 0, in: 0, balance: 0 }) }))
    .sort((a, b) => b.balance - a.balance);
  const owing = rows.filter((r) => r.balance > 0);
  const inStreet = owing.reduce((s, r) => s + r.balance, 0);
  const out30 = last30.find((r) => r.direction === "out")?._sum.quantity ?? 0;
  const in30 = last30.find((r) => r.direction === "in")?._sum.quantity ?? 0;
  const returnRate = out30 ? Math.round((in30 / out30) * 100) : 0;

  return (
    <div>
      <PageHeader
        title="Control de envases retornables"
        subtitle="Libro de bidones entregados y devueltos por cliente, ligado a cada entrega."
      />
      <Flash ok={sp.ok} error={sp.error} />

      <section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Envases en la calle" value={inStreet} hint="Saldo total a recuperar" icon={Package} tone="navy" />
        <StatCard label="Clientes con deuda" value={owing.length} hint="Saldo de envases > 0" icon={UserX} tone="amber" />
        <StatCard label="Entregados 30 días" value={out30} icon={ArrowUpRight} tone="brand" />
        <StatCard label="Devueltos 30 días" value={in30} hint={`Tasa de retorno ${returnRate}%`} icon={ArrowDownLeft} tone="emerald" />
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <section className="overflow-hidden rounded-xl border border-[#d5e3ec] bg-white">
          <header className="flex items-center justify-between border-b border-[#e8f0f5] px-4 py-3">
            <h2 className="flex items-center gap-2 font-semibold text-[var(--brand-deep)]">
              <PackageOpen className="size-4 text-[var(--brand)]" /> Clientes que deben envases
            </h2>
            <span className="text-xs text-[#5a6578]">{owing.length} clientes</span>
          </header>
          {owing.length > 6 ? (
            <div className="border-b border-[#eef3f7] bg-[#fafcfd] px-4 py-2.5">
              <ListQuickFilter scope="owing-table" placeholder="Filtrar por cliente o comuna…" />
            </div>
          ) : null}
          <div className="overflow-x-auto">
          <table id="owing-table" className="w-full min-w-[520px] text-sm">
            <caption className="sr-only">Clientes con saldo de envases por devolver</caption>
            <thead>
              <tr className="border-b border-[#e8f0f5] text-left text-[11px] uppercase tracking-wide text-[#5a6578]">
                <th scope="col" className="px-4 py-2">Cliente</th>
                <th scope="col" className="px-2 py-2 text-right">Entregados</th>
                <th scope="col" className="px-2 py-2 text-right">Devueltos</th>
                <th scope="col" className="px-2 py-2 text-right">Saldo</th>
                <th scope="col" className="px-4 py-2 text-right">
                  <span className="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eef3f7]">
              {owing.map((r) => (
                <tr key={r.id} data-filter-text={`${r.name} ${r.phone} ${r.address ?? ""} ${r.commune ?? ""}`}>
                  <td className="px-4 py-2.5">
                    <p className="font-medium text-[var(--brand-deep)]">{r.name}</p>
                    <p className="text-xs text-[#5a6578]">
                      {r.address ?? ""}
                      {r.commune ? `, ${r.commune}` : ""}
                    </p>
                  </td>
                  <td className="px-2 py-2.5 text-right tabular-nums">{r.out}</td>
                  <td className="px-2 py-2.5 text-right tabular-nums">{r.in}</td>
                  <td className="px-2 py-2.5 text-right">
                    <Pill className={r.balance >= 4 ? "bg-rose-50 text-rose-800 ring-rose-200" : "bg-amber-50 text-amber-800 ring-amber-200"}>
                      {r.balance}
                    </Pill>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <a
                      href={customerWhatsappHref(r.phone, `Hola ${r.name.split(" ")[0]}, te escribe ${admin.tenant.name}. Tenés ${r.balance} bidón(es) nuestro(s); ¿los retiramos en tu próxima entrega?`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(btn.ghost, "text-emerald-700")}
                    >
                      <MessageCircle className="size-3.5" /> Pedir retiro
                    </a>
                  </td>
                </tr>
              ))}
              {owing.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <EmptyState
                      compact
                      icon={<PackageCheck />}
                      title="Ningún cliente debe envases"
                      description="Todos los bidones entregados ya volvieron. ¡Buen trabajo!"
                    />
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
          </div>
        </section>

        <aside className="space-y-4">
          <form action={addBottleMovementAction} className="space-y-2 rounded-xl border border-[#d5e3ec] bg-white p-4">
            <h2 className="font-semibold text-[var(--brand-deep)]">Registrar movimiento</h2>
            <label className="block text-xs font-medium text-[#5a6578]">
              Cliente
              <select name="customerId" required defaultValue="" className={cn(field, "mt-1 w-full")}>
                <option value="" disabled>
                  Elige un cliente…
                </option>
                {rows.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} (saldo {r.balance})
                  </option>
                ))}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="block text-xs font-medium text-[#5a6578]">
                Movimiento
                <select name="direction" defaultValue="in" className={cn(field, "mt-1 w-full")}>
                  <option value="in">Devuelve (entra)</option>
                  <option value="out">Se lleva (sale)</option>
                </select>
              </label>
              <label className="block text-xs font-medium text-[#5a6578]">
                Cantidad
                <input type="number" inputMode="numeric" name="quantity" min={1} max={500} defaultValue={1} required className={cn(field, "mt-1 w-full")} />
              </label>
            </div>
            <label className="block text-xs font-medium text-[#5a6578]">
              Motivo
              <select name="reason" defaultValue="devolucion" className={cn(field, "mt-1 w-full")}>
                <option value="devolucion">Devolución</option>
                <option value="entrega">Entrega</option>
                <option value="ajuste">Ajuste de inventario</option>
              </select>
            </label>
            <label className="block text-xs font-medium text-[#5a6578]">
              Nota <span className="font-normal text-[#8a96a6]">(opcional)</span>
              <input name="note" maxLength={300} placeholder="Ej: devolvió en planta" className={cn(field, "mt-1 w-full")} />
            </label>
            <button type="submit" className={cn(btn.primary, "w-full")}>Registrar</button>
          </form>
          <p className="rounded-xl border border-dashed border-[#d5e3ec] bg-[#fbfdfe] p-4 text-xs leading-relaxed text-[#5a6578]">
            Al confirmar una entrega en Despacho se registra automáticamente la salida de bidones (productos «bidón / recarga / botellón») y la devolución informada por el chofer.
          </p>
        </aside>
      </div>

      <section className="mt-6 overflow-hidden rounded-xl border border-[#d5e3ec] bg-white">
        <header className="border-b border-[#e8f0f5] px-4 py-3">
          <h2 className="font-semibold text-[var(--brand-deep)]">Últimos movimientos</h2>
        </header>
        <ul className="divide-y divide-[#eef3f7] text-sm">
          {recent.map((m) => (
            <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2">
              <span className="flex items-center gap-2">
                {m.direction === "out" ? (
                  <ArrowUpRight className="size-4 text-[var(--brand)]" />
                ) : (
                  <ArrowDownLeft className="size-4 text-emerald-600" />
                )}
                <strong className="text-[var(--brand-deep)]">{m.customer.name}</strong>
                <span className="text-[#5a6578]">
                  {m.direction === "out" ? "recibió" : "devolvió"} {m.quantity} · {REASON_LABEL[m.reason] ?? m.reason}
                  {m.orderId ? ` · pedido #${shortRef(m.orderId)}` : ""}
                  {m.note ? ` · ${m.note}` : ""}
                </span>
              </span>
              <span className="text-xs text-[#8a95a6]">{formatDateTimeCl(m.createdAt)}</span>
            </li>
          ))}
          {recent.length === 0 ? (
            <li>
              <EmptyState
                compact
                icon={<Package />}
                title="Sin movimientos aún"
                description="Se registran solos al confirmar entregas en Despacho, o manualmente con el formulario."
              />
            </li>
          ) : null}
        </ul>
      </section>
    </div>
  );
}
