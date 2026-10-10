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
    <div className="bg-white">
      <div className="bg-[var(--brand)] px-4 py-6 text-white md:px-6">
        <div className="mx-auto max-w-6xl">
          <Link href="/productos" className="text-sm text-white/90 hover:underline">
            ← Productos
          </Link>
          <h1 className="rc-display mt-2 text-3xl uppercase md:text-4xl">
            {product.name}
          </h1>
        </div>
      </div>
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-2 md:px-6">
        <div className="aspect-square border border-[#e4eef4] bg-[#f7fbfd]">
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.imageUrl}
              alt={product.name}
              className="h-full w-full object-contain p-6"
            />
          ) : null}
        </div>
        <div className="flex flex-col justify-center">
          <p className="text-3xl font-bold text-[var(--brand)]">
            {formatClp(product.priceClp)}
          </p>
          {product.description ? (
            <div className="mt-6 space-y-3 text-sm leading-relaxed text-[#5a6578] whitespace-pre-line">
              {product.description}
            </div>
          ) : null}
          <div className="mt-8">
            <AddToCartForm productId={product.id} />
          </div>
          {(tenant.phone || tenant.whatsapp) && (
            <p className="mt-6 text-sm text-[#5a6578]">
              También podés pedir por teléfono{" "}
              {tenant.phone ? (
                <a
                  className="font-bold text-[var(--brand-deep)]"
                  href={`tel:${tenant.phone}`}
                >
                  {tenant.phone}
                </a>
              ) : null}
              {tenant.whatsapp ? (
                <>
                  {" "}
                  o{" "}
                  <a
                    className="font-bold text-[var(--brand-deep)]"
                    href={`https://wa.me/${tenant.whatsapp.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
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
