import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, Droplets, Phone } from "lucide-react";
import { AddToCartForm } from "@/components/storefront/add-to-cart-form";
import { prisma } from "@/lib/db";
import { requireTenant } from "@/lib/tenant";
import { formatClp } from "@/lib/utils";
import { tenantWhatsappHref } from "@/lib/whatsapp";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tenant = await requireTenant();
  const product = await prisma.product.findUnique({
    where: { tenantId_slug: { tenantId: tenant.id, slug } },
  });
  return { title: product?.name ?? "Producto" };
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  const tenant = await requireTenant();
  const product = await prisma.product.findFirst({
    where: { tenantId: tenant.id, slug, active: true },
  });
  if (!product) notFound();
  const whatsapp = tenantWhatsappHref(
    tenant.whatsapp,
    `Hola ${tenant.name}, quiero consultar por ${product.name}.`,
  );

  return (
    <div className="bg-[linear-gradient(180deg,var(--mist)_0%,#fff_420px)]">
      <div className="relative overflow-hidden bg-[linear-gradient(120deg,var(--brand)_0%,color-mix(in_srgb,var(--brand)_55%,var(--brand-deep))_100%)] px-4 py-8 text-white md:px-6 md:py-10">
        <div aria-hidden className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-white/10 blur-2xl" />
        <div className="relative mx-auto max-w-6xl sf-rise-stagger">
          <Link
            href="/productos"
            className="group inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white ring-1 ring-white/25 backdrop-blur-sm transition hover:bg-white/25"
          >
            <ArrowLeft className="size-3.5 transition-transform duration-300 group-hover:-translate-x-0.5" aria-hidden />
            Productos
          </Link>
          <h1 className="rc-display mt-3 text-3xl uppercase md:text-5xl">
            {product.name}
          </h1>
        </div>
      </div>
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-2 md:gap-14 md:px-6 md:py-16">
        <div className="sf-enter sf-card aspect-square overflow-hidden p-2">
          <div className="h-full w-full rounded-[calc(var(--radius)*1.4)] bg-[radial-gradient(120%_90%_at_50%_15%,#fff_0%,var(--mist)_100%)]">
            {product.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.imageUrl}
                alt={product.name}
                className="h-full w-full object-contain p-8 mix-blend-multiply"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-[var(--brand)]">
                <Droplets className="size-20 opacity-40" aria-label="Sin imagen" />
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col justify-center sf-rise-stagger">
          <p className="w-fit rounded-full bg-[color-mix(in_srgb,var(--brand)_10%,#fff)] px-4 py-1 text-3xl font-bold text-[var(--brand)] ring-1 ring-[color-mix(in_srgb,var(--brand)_20%,transparent)]">
            {formatClp(product.priceClp)}
          </p>
          {product.description ? (
            <div className="mt-6 space-y-3 text-[15px] leading-relaxed text-[#5a6578] whitespace-pre-line">
              {product.description}
            </div>
          ) : null}
          <div className="mt-8 border-t border-[var(--sf-line)] pt-8">
            <AddToCartForm productId={product.id} />
          </div>
          {(tenant.phone || whatsapp) && (
            <p className="mt-6 text-sm text-[#5a6578]">
              <Phone className="mr-1.5 inline size-4 -translate-y-px text-[var(--brand)]" aria-hidden />
              También podés pedir por teléfono{" "}
              {tenant.phone ? (
                <a
                  className="font-bold text-[var(--brand-deep)]"
                  href={`tel:${tenant.phone}`}
                >
                  {tenant.phone}
                </a>
              ) : null}
              {whatsapp ? (
                <>
                  {" "}
                  o{" "}
                  <a
                    className="font-bold text-[var(--brand-deep)]"
                    href={whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    WhatsApp
                  </a>
                </>
              ) : null}
              .
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
