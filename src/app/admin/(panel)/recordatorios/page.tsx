import type { Prisma } from "@prisma/client";
import { headers } from "next/headers";
import Link from "next/link";
import { BellRing, CalendarClock, MessageCircle, PartyPopper, Repeat, SearchX, UserPlus, Users } from "lucide-react";
import { EmptyState, Pagination, paginate } from "@/components/admin/ui";
import {
  createRecurringCustomerAction,
  recordReminderAction,
  updateRecurrenceAction,
} from "./actions";
import { ReminderLink } from "@/components/admin/client-helpers";
import { Flash, ModuleDisabled, PageHeader, Pill, StatCard, btn, field } from "@/components/admin/dispatch-ui";
import { prisma } from "@/lib/db";
import {
  FREQUENCIES,
  FREQUENCY_LABEL,
  addDaysStr,
  customerWhatsappHref,
  dateFromStr,
  formatDateCl,
  formatDateTimeCl,
  toDateStr,
  todayCl,
} from "@/lib/dispatch";
import { requireTenantModule } from "@/lib/tenant-admin";
import { cn } from "@/lib/utils";
import { formatChileWhatsapp, normalizeChileWhatsapp } from "@/lib/whatsapp";

const DUE_WINDOW_DAYS = 3;
const PAGE_SIZE = 20;

export default async function RemindersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; ver?: string; page?: string; ok?: string; error?: string }>;
}) {
  const { admin, tenantId, enabled } = await requireTenantModule("recordatorios");
  if (!enabled) return <ModuleDisabled name="Recordatorios / suscripción" />;
  const sp = await searchParams;
  const today = todayCl();
  const horizon = dateFromStr(addDaysStr(today, DUE_WINDOW_DAYS));
  const q = sp.q?.trim();
  const onlyRecurring = sp.ver !== "todos";

  const where: Prisma.DeliveryCustomerWhereInput = {
    tenantId,
    ...(onlyRecurring ? { recurring: true } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { phone: { contains: q.replace(/\D/g, "") || q } },
            { commune: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const customerTotal = await prisma.deliveryCustomer.count({ where });
  const { page, pages, skip, take } = paginate(sp.page, customerTotal, PAGE_SIZE);
  const [due, customers, recurringCount, byFreq] = await Promise.all([
    prisma.deliveryCustomer.findMany({
      where: { tenantId, recurring: true, nextDeliveryDate: { lte: horizon } },
      orderBy: { nextDeliveryDate: "asc" },
      take: 50,
    }),
    prisma.deliveryCustomer.findMany({
      where,
      orderBy: [{ recurring: "desc" }, { nextDeliveryDate: "asc" }, { name: "asc" }],
      skip,
      take,
    }),
    prisma.deliveryCustomer.count({ where: { tenantId, recurring: true } }),
    prisma.deliveryCustomer.groupBy({
      by: ["frequency"],
      where: { tenantId, recurring: true },
      _count: true,
    }),
  ]);
  const host = (await headers()).get("host");
  const shopUrl = host ? `https://${host}/productos` : "";
  const companyWhatsapp = normalizeChileWhatsapp(admin.tenant.whatsapp);
  const reminderText = (name: string, next: string | null) =>
    [
      `Hola ${name.split(" ")[0]}, te saluda ${admin.tenant.name}. Te toca reponer tu agua el ${formatDateCl(next, "long")}. ¿Te agendamos el despacho?`,
      shopUrl ? `Podés pedir aquí: ${shopUrl}` : "",
      companyWhatsapp ? `o escríbenos al WhatsApp ${formatChileWhatsapp(companyWhatsapp)}.` : "",
    ]
      .filter(Boolean)
      .join(" ");
  const overdue = due.filter((c) => toDateStr(c.nextDeliveryDate)! < today).length;
  const freqCount = (f: string) => byFreq.find((r) => r.frequency === f)?._count ?? 0;

  return (
    <div>
      <PageHeader
        title="Recordatorios y suscripciones"
        subtitle="Clientes recurrentes, próxima reposición y recordatorio por WhatsApp en un clic."
      />
      <Flash ok={sp.ok} error={sp.error} />

      <section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Recurrentes" value={recurringCount} hint={`${freqCount("semanal")} sem · ${freqCount("quincenal")} quin · ${freqCount("mensual")} men`} icon={Repeat} tone="navy" />
        <StatCard label="Próximos a reponer" value={due.length} hint={`Próximos ${DUE_WINDOW_DAYS} días`} icon={CalendarClock} tone="brand" />
        <StatCard label="Atrasados" value={overdue} hint="Fecha de reposición vencida" icon={BellRing} tone="rose" />
        <StatCard label="Clientes" value={customerTotal} hint={onlyRecurring ? "Mostrando recurrentes" : "Todos los clientes"} icon={Users} tone="sky" />
      </section>

      <section className="mt-6 overflow-hidden rounded-xl border border-[#9fdcef] bg-white">
        <header className="flex items-center justify-between border-b border-[#e8f0f5] bg-[linear-gradient(90deg,#e6f7fc,#f4fbfe)] px-4 py-3">
          <h2 className="flex items-center gap-2 font-semibold text-[var(--brand-deep)]">
            <BellRing className="size-4 text-[var(--brand)]" /> Próximos a reponer
          </h2>
          <span className="text-xs text-[#5a6578]">Vencidos y hasta {formatDateCl(addDaysStr(today, DUE_WINDOW_DAYS))}</span>
        </header>
        <p className="flex flex-wrap items-center gap-x-1 border-b border-[#eef3f7] bg-[#fbfdfe] px-4 py-2 text-xs text-[#5a6578]">
          <MessageCircle className="size-3.5 text-emerald-600" />
          Se envía desde el WhatsApp abierto en este dispositivo; usa el de la empresa.
          {companyWhatsapp ? (
            <span>
              El mensaje incluye tu número <strong>{formatChileWhatsapp(companyWhatsapp)}</strong>.
            </span>
          ) : (
            <span>
              <Link href="/admin/marca#contacto" className="font-medium text-[var(--brand)] underline">
                Configura el WhatsApp de la empresa
              </Link>{" "}
              para incluirlo en el mensaje.
            </span>
          )}
        </p>
        {due.length === 0 ? (
          <EmptyState
            compact
            icon={<PartyPopper />}
            title="Nadie por reponer en los próximos días"
            description="Cuando un cliente recurrente esté por quedarse sin agua, aparecerá aquí con su recordatorio listo."
          />
        ) : (
          <ul className="divide-y divide-[#eef3f7]">
            {due.map((c) => {
              const next = toDateStr(c.nextDeliveryDate);
              const late = next! < today;
              return (
                <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-[var(--brand-deep)]">
                      {c.name}{" "}
                      <Pill className="ml-1 bg-white text-[#5a6578] ring-[#d5e3ec]">{FREQUENCY_LABEL[c.frequency ?? ""] ?? "—"}</Pill>
                    </p>
                    <p className="text-sm text-[#5a6578]">
                      +{c.phone} · {c.address ?? "sin dirección"}
                      {c.commune ? `, ${c.commune}` : ""}
                    </p>
                    <p className="text-xs text-[#8a95a6]">
                      Último recordatorio: {c.lastReminderAt ? formatDateTimeCl(c.lastReminderAt) : "nunca"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Pill className={late ? "bg-rose-50 text-rose-800 ring-rose-200" : next === today ? "bg-amber-50 text-amber-800 ring-amber-200" : "bg-sky-50 text-sky-800 ring-sky-200"}>
                      {late ? "Atrasado · " : next === today ? "Hoy · " : ""}
                      {formatDateCl(next)}
                    </Pill>
                    <ReminderLink
                      href={customerWhatsappHref(c.phone, reminderText(c.name, next))}
                      onRecord={recordReminderAction.bind(null, c.id)}
                      className={btn.success}
                    >
                      <MessageCircle className="size-4" /> Recordar por WhatsApp
                    </ReminderLink>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <section className="overflow-hidden rounded-xl border border-[#d5e3ec] bg-white">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e8f0f5] px-4 py-3">
            <h2 className="font-semibold text-[var(--brand-deep)]">Clientes</h2>
            <form method="get" role="search" className="flex w-full flex-wrap gap-2 sm:w-auto">
              <label htmlFor="rem-q" className="sr-only">
                Buscar cliente
              </label>
              <input
                id="rem-q"
                name="q"
                type="search"
                defaultValue={q ?? ""}
                placeholder="Buscar nombre, teléfono o comuna"
                className={cn(field, "min-w-0 flex-1 sm:w-56 sm:flex-none")}
              />
              <label htmlFor="rem-ver" className="sr-only">
                Mostrar
              </label>
              <select id="rem-ver" name="ver" defaultValue={onlyRecurring ? "" : "todos"} className={field}>
                <option value="">Solo recurrentes</option>
                <option value="todos">Todos</option>
              </select>
              <button className={btn.primary} type="submit">Buscar</button>
            </form>
          </header>
          <ul className="divide-y divide-[#eef3f7]">
            {customers.map((c) => (
              <li key={c.id} className="px-4 py-3">
                <form action={updateRecurrenceAction} className="grid items-center gap-2 md:grid-cols-[minmax(0,1.4fr)_auto_auto_auto_auto]">
                  <input type="hidden" name="customerId" value={c.id} />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-[var(--brand-deep)]">{c.name}</p>
                    <p className="truncate text-xs text-[#5a6578]">
                      +{c.phone}
                      {c.commune ? ` · ${c.commune}` : ""}
                      {c.lastDeliveredAt ? ` · última entrega ${formatDateTimeCl(c.lastDeliveredAt)}` : ""}
                    </p>
                  </div>
                  <label className="inline-flex items-center gap-1.5 text-sm text-[var(--brand-deep)]">
                    <input type="checkbox" name="recurring" defaultChecked={c.recurring} className="size-4 accent-[var(--brand)]" />
                    Recurrente
                  </label>
                  <select name="frequency" defaultValue={c.frequency ?? ""} className={field} aria-label={`Frecuencia de ${c.name}`}>
                    <option value="">Frecuencia</option>
                    {FREQUENCIES.map((f) => (
                      <option key={f} value={f}>{FREQUENCY_LABEL[f]}</option>
                    ))}
                  </select>
                  <input type="date" name="nextDeliveryDate" defaultValue={toDateStr(c.nextDeliveryDate) ?? ""} className={field} aria-label={`Próxima entrega de ${c.name}`} />
                  <button type="submit" className={btn.outline} aria-label={`Guardar suscripción de ${c.name}`}>Guardar</button>
                </form>
              </li>
            ))}
            {customers.length === 0 ? (
              <li>
                <EmptyState
                  compact
                  icon={q ? <SearchX /> : <Users />}
                  title={q ? "Sin clientes para esta búsqueda" : "Aún no hay clientes recurrentes"}
                  description={q ? "Prueba con otro nombre, teléfono o comuna." : "Agrega el primero con el formulario de la derecha."}
                  action={
                    q ? (
                      <Link href="/admin/recordatorios" className={btn.outline}>
                        Limpiar búsqueda
                      </Link>
                    ) : undefined
                  }
                />
              </li>
            ) : null}
          </ul>
          {customerTotal > PAGE_SIZE ? (
            <div className="border-t border-[#e8f0f5] bg-[#fafcfd] px-4 py-3">
              <Pagination
                page={page}
                pages={pages}
                total={customerTotal}
                pageSize={PAGE_SIZE}
                basePath="/admin/recordatorios"
                params={{ q, ver: sp.ver }}
                noun="clientes"
              />
            </div>
          ) : null}
        </section>

        <aside className="space-y-4">
          <form action={createRecurringCustomerAction} className="space-y-2 rounded-xl border border-[#d5e3ec] bg-white p-4">
            <h2 className="flex items-center gap-2 font-semibold text-[var(--brand-deep)]">
              <UserPlus className="size-4 text-[var(--brand)]" /> Nuevo cliente recurrente
            </h2>
            <label className="block text-xs font-medium text-[#5a6578]">
              Nombre
              <input name="name" required minLength={2} maxLength={120} autoComplete="off" placeholder="María Pérez" className={cn(field, "mt-1 w-full")} />
            </label>
            <label className="block text-xs font-medium text-[#5a6578]">
              WhatsApp / teléfono
              <input
                name="phone"
                type="tel"
                inputMode="tel"
                required
                minLength={8}
                pattern="[+\d\s()-]{8,}"
                title="Ingresa al menos 8 dígitos"
                placeholder="+56 9 1234 5678"
                className={cn(field, "mt-1 w-full")}
              />
            </label>
            <label className="block text-xs font-medium text-[#5a6578]">
              Dirección <span className="font-normal text-[#8a96a6]">(opcional)</span>
              <input name="address" placeholder="Av. Siempre Viva 123" className={cn(field, "mt-1 w-full")} />
            </label>
            <label className="block text-xs font-medium text-[#5a6578]">
              Comuna <span className="font-normal text-[#8a96a6]">(opcional)</span>
              <input name="commune" placeholder="Providencia" className={cn(field, "mt-1 w-full")} />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="block text-xs font-medium text-[#5a6578]">
                Frecuencia
                <select name="frequency" required defaultValue="quincenal" className={cn(field, "mt-1 w-full")}>
                  {FREQUENCIES.map((f) => (
                    <option key={f} value={f}>{FREQUENCY_LABEL[f]}</option>
                  ))}
                </select>
              </label>
              <label className="block text-xs font-medium text-[#5a6578]">
                Próxima entrega
                <input type="date" name="nextDeliveryDate" min={today} className={cn(field, "mt-1 w-full")} />
              </label>
            </div>
            <button type="submit" className={cn(btn.primary, "w-full")}>Agregar</button>
          </form>
          <div className="rounded-xl border border-dashed border-[#d5e3ec] bg-[#fbfdfe] p-4 text-xs leading-relaxed text-[#5a6578]">
            <p className="font-semibold text-[var(--brand-deep)]">¿Cómo funciona?</p>
            <p className="mt-1">
              Al marcar un pedido como <strong>Entregado</strong>, la próxima reposición del cliente recurrente se recalcula sola según su frecuencia.
              El botón de WhatsApp abre el mensaje listo para enviar y registra la fecha del recordatorio.
            </p>
            <p className="mt-2">
              <strong>Envío automático por SMS / WhatsApp API:</strong> próximamente (hoy el envío es manual, en un clic).
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
