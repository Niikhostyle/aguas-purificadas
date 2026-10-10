import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AddToCartForm } from "@/components/storefront/add-to-cart-form";
import { prisma } from "@/lib/db";
import { requireTenant } from "@/lib/tenant";
import { formatClp } from "@/lib/utils";

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

  return (
    <div className="bg-[linear-gradient(180deg,#dceee9_0%,#f3f7f6_40%)]">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 pb-20 pt-12 md:grid-cols-2 md:px-8">
        <div className="aspect-square bg-[linear-gradient(145deg,#d7ebe6_0%,#9ec9c2_100%)]" />
        <div className="flex flex-col justify-center">
          <Link
            href="/productos"
            className="text-sm text-[var(--brand)] underline-offset-4 hover:underline"
          >
            ← Volver al catálogo
          </Link>
          <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl text-[var(--brand-deep)]">
            {product.name}
          </h1>
          <p className="mt-4 text-2xl font-medium text-[var(--brand)]">
            {formatClp(product.priceClp)}
          </p>
          {product.description ? (
            <p className="mt-6 max-w-prose leading-relaxed text-[#2f4a44]">
              {product.description}
            </p>
          ) : null}
          <div className="mt-8">
            <AddToCartForm productId={product.id} />
          </div>
          <p className="mt-6 text-sm text-[#4a655f]">
            El pago WebPay se suma en la siguiente fase. Por ahora el pedido queda
            registrado como pendiente para coordinación.
          </p>
          {tenant.whatsapp || tenant.phone ? (
            <div className="mt-4 flex flex-wrap gap-3 text-sm">
              {tenant.whatsapp ? (
                <a
                  href={`https://wa.me/${tenant.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(`Hola, me interesa: ${product.name}`)}`}
                  className="text-[var(--brand)] underline-offset-4 hover:underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  WhatsApp
                </a>
              ) : null}
              {tenant.phone ? (
                <a
                  href={`tel:${tenant.phone}`}
                  className="text-[var(--brand)] underline-offset-4 hover:underline"
                >
                  {tenant.phone}
                </a>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
