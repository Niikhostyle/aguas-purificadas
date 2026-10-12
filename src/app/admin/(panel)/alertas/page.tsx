import Link from "next/link";
import {
  BellRing,
  CalendarX,
  CircleDollarSign,
  ExternalLink,
  MessageCircle,
  Package,
  PackageX,
  Route as RouteIcon,
  ShoppingBag,
  TruckIcon,
  UserMinus,
} from "lucide-react";
import { markOrderCollectedAction } from "./actions";
import { Flash, PageHeader, StatCard, btn } from "@/components/admin/dispatch-ui";
import { ConfirmSubmitButton, EmptyState, Panel } from "@/components/admin/ui";
import { customerWhatsappHref, formatDateCl, shortRef } from "@/lib/dispatch";
import { platformUrl } from "@/lib/platform-url";
import { requireTenantAdmin } from "@/lib/tenant-admin";
import {
  BOTTLES_HIGH_BALANCE,
  BOTTLES_STALE_DAYS,
  LOW_STOCK,
  NO_PURCHASE_DAYS,
  alertCount,
  getTenantAlerts,
} from "@/lib/tenant-alerts";
import { cn, formatClp } from "@/lib/utils";

export const dynamic = "force-dynamic";

const firstName = (name: string) => name.trim().split(/\s+/)[0] || name;
const dayCl = (d: Date) =>
  d.toLocaleDateString("es-CL", { timeZone: "America/Santiago", day: "numeric", month: "short" });

function WhatsappButton({ phone, text }: { phone: string; text: string }) {
  return (
    <a
      href={customerWhatsappHref(phone, text)}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
    >
      <MessageCircle className="size-3.5" /> WhatsApp
    </a>
  );
}

function Row({ title, detail, children }: { title: string; detail: React.ReactNode; children?: React.ReactNode }) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-[#12233d]">{title}</p>
        <p className="text-xs text-[#5a6578]">{detail}</p>
      </div>
      {children ? <div className="flex flex-wrap items-center gap-2">{children}</div> : null}
    </li>
  );
}

function Section({
  id,
  title,
  description,
  icon,
  count,
  tone,
  children,
}: {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  count: number;
  tone: "rose" | "amber" | "sky";
  children: React.ReactNode;
}) {
  const toneClass = {
    rose: "bg-rose-50 text-rose-700 ring-rose-200",
    amber: "bg-amber-50 text-amber-800 ring-amber-200",
    sky: "bg-sky-50 text-sky-800 ring-sky-200",
  }[tone];
  return (
    <Panel
      id={id}
      flush
      title={
        <span className="flex items-center gap-2">
          <span className={cn("grid size-7 place-items-center rounded-lg ring-1 ring-inset [&>svg]:size-4", toneClass)}>{icon}</span>
          {title}
          <span className={cn("rounded-full px-2 py-0.5 text-xs font-bold ring-1 ring-inset", toneClass)}>{count}</span>
        </span>
      }
      description={description}
    >
      {count ? (
        <ul className="divide-y divide-[#eef3f7]">{children}</ul>
      ) : (
        <EmptyState compact title="Todo en orden" description="No hay nada pendiente aquí." />
      )}
    </Panel>
  );
}

export default async function AlertsPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const { admin, tenantId, flags } = await requireTenantAdmin();
  const sp = await searchParams;
  const a = await getTenantAlerts(tenantId, flags);
  const total = alertCount(a);
  const company = admin.tenant.name;
  const shopUrl = platformUrl("/productos", admin.tenant.slug);

  return (
    <div>
      <PageHeader
        title="Alertas"
        subtitle="Clientes que dejaron de comprar, envases por recuperar, pagos por cobrar y pedidos que necesitan atención."
      />
      <Flash ok={sp.ok} error={sp.error} />

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Por cobrar"
          value={formatClp(a.debtTotalClp)}
          hint={`${a.debtors.length} pedido(s) entregados sin pagar`}
          icon={CircleDollarSign}
          tone="rose"
          href="#morosos"
        />
        <StatCard
          label="Sin compra"
          value={a.noPurchase.length}
          hint="Clientes que no han vuelto a pedir"
          icon={UserMinus}
          tone="amber"
          href="#sin-compra"
        />
        <StatCard
          label="Envases pendientes"
          value={a.bottles.reduce((s, b) => s + b.balance, 0)}
          hint={`${a.bottles.length} cliente(s) con envases por devolver`}
          icon={Package}
          tone="navy"
          href="#envases"
        />
        <StatCard label="Alertas en total" value={total} hint="Se recalculan cada vez que abres esta página" icon={BellRing} tone="brand" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Section
          id="morosos"
          title="Morosos"
          description="Pedidos entregados que siguen sin pago registrado. Cuando cobres, márcalos como cobrados."
          icon={<CircleDollarSign />}
          count={a.debtors.length}
          tone="rose"
        >
          {a.debtors.map((o) => (
            <Row
              key={o.id}
              title={`${o.customerName} · ${formatClp(o.totalClp)}`}
              detail={`Pedido #${shortRef(o.id)} · entregado ${o.deliveredAt ? dayCl(o.deliveredAt) : "sin fecha"}`}
            >
              <WhatsappButton
                phone={o.customerPhone}
                text={`Hola ${firstName(o.customerName)}, te escribe ${company}. Te recordamos que quedó pendiente el pago de tu pedido #${shortRef(o.id)} por ${formatClp(o.totalClp)}. ¿Nos confirmas cuándo puedes realizarlo? ¡Gracias!`}
              />
              <form action={markOrderCollectedAction}>
                <input type="hidden" name="orderId" value={o.id} />
                <ConfirmSubmitButton
                  className={cn(btn.success, "h-8 px-2.5 text-xs")}
                  tone="primary"
                  confirmTitle="¿Registrar el pago?"
                  confirmText={`El pedido de ${o.customerName} por ${formatClp(o.totalClp)} quedará como pagado.`}
                  confirmLabel="Marcar cobrado"
                >
                  Marcar cobrado
                </ConfirmSubmitButton>
              </form>
            </Row>
          ))}
        </Section>

        <Section
          id="sin-compra"
          title="Sin compra"
          description={`Clientes sin pedidos según su frecuencia (o hace más de ${NO_PURCHASE_DAYS} días si no tienen una).`}
          icon={<UserMinus />}
          count={a.noPurchase.length}
          tone="amber"
        >
          {a.noPurchase.map((c) => (
            <Row
              key={c.id}
              title={c.name}
              detail={`Última entrega hace ${c.daysSince} días${c.commune ? ` · ${c.commune}` : ""}`}
            >
              <WhatsappButton
                phone={c.phone}
                text={`Hola ${firstName(c.name)}, te saluda ${company}. ¿Cómo vas con el agua? Si necesitas reponer, puedes pedir aquí: ${shopUrl} o responder este mensaje y te agendamos el despacho.`}
              />
            </Row>
          ))}
        </Section>

        {flags.envases ? (
          <Section
            id="envases"
            title="Envases pendientes"
            description={`Clientes con ${BOTTLES_HIGH_BALANCE} o más envases, o con envases hace más de ${BOTTLES_STALE_DAYS} días.`}
            icon={<PackageX />}
            count={a.bottles.length}
            tone="amber"
          >
            {a.bottles.map((c) => (
              <Row
                key={c.id}
                title={`${c.name} · ${c.balance} envase(s)`}
                detail={c.daysSince != null ? `Última entrega hace ${c.daysSince} días` : "Sin entregas registradas"}
              >
                <WhatsappButton
                  phone={c.phone}
                  text={`Hola ${firstName(c.name)}, te escribe ${company}. Tienes ${c.balance} bidón(es) nuestro(s); ¿los retiramos en tu próxima entrega?`}
                />
              </Row>
            ))}
          </Section>
        ) : null}

        {flags.recordatorios ? (
          <Section
            id="reposiciones"
            title="Reposiciones atrasadas"
            description="Clientes con suscripción cuya fecha de reposición ya pasó y no tienen pedido en curso."
            icon={<CalendarX />}
            count={a.overdueRefills.length}
            tone="amber"
          >
            {a.overdueRefills.map((c) => (
              <Row key={c.id} title={c.name} detail={`Tocaba el ${formatDateCl(c.nextDeliveryDate.toISOString().slice(0, 10))}`}>
                <WhatsappButton
                  phone={c.phone}
                  text={`Hola ${firstName(c.name)}, te saluda ${company}. Ya te tocaba reponer tu agua. ¿Te agendamos el despacho?`}
                />
              </Row>
            ))}
          </Section>
        ) : null}

        {flags.despacho ? (
          <Section
            id="no-entregados"
            title="No entregados"
            description="Pedidos que el chofer no pudo entregar. Coordina una nueva fecha."
            icon={<TruckIcon />}
            count={a.failedDeliveries.length}
            tone="rose"
          >
            {a.failedDeliveries.map((o) => (
              <Row key={o.id} title={o.customerName} detail={`#${shortRef(o.id)} · ${o.customerAddress}`}>
                <WhatsappButton
                  phone={o.customerPhone}
                  text={`Hola ${firstName(o.customerName)}, te escribe ${company}. No pudimos entregar tu pedido #${shortRef(o.id)}. ¿Coordinamos una nueva entrega?`}
                />
                <Link href={`/admin/pedidos/${o.id}`} className={cn(btn.outline, "h-8 px-2.5 text-xs")}>
                  <ExternalLink className="size-3.5" /> Ver
                </Link>
              </Row>
            ))}
          </Section>
        ) : null}

        {flags.despacho ? (
          <Section
            id="sin-ruta"
            title="Sin ruta hace más de 24 h"
            description="Pedidos listos para despachar que aún no tienen ruta."
            icon={<RouteIcon />}
            count={a.unassigned.length}
            tone="sky"
          >
            {a.unassigned.map((o) => (
              <Row
                key={o.id}
                title={o.customerName}
                detail={`#${shortRef(o.id)} · ${o.customerAddress} · desde ${dayCl(o.createdAt)}`}
              >
                <Link href="/admin/despacho?fecha=todas&estado=por_asignar" className={cn(btn.outline, "h-8 px-2.5 text-xs")}>
                  Asignar
                </Link>
              </Row>
            ))}
          </Section>
        ) : null}

        <Section
          id="stock"
          title="Stock bajo"
          description={`Productos activos con ${LOW_STOCK} unidades o menos.`}
          icon={<ShoppingBag />}
          count={a.lowStock.length}
          tone="sky"
        >
          {a.lowStock.map((p) => (
            <Row key={p.id} title={p.name} detail={p.stock === 0 ? "Agotado" : `Quedan ${p.stock}`}>
              <Link href={`/admin/productos/${p.id}`} className={cn(btn.outline, "h-8 px-2.5 text-xs")}>
                Editar
              </Link>
            </Row>
          ))}
        </Section>
      </div>
    </div>
  );
}
