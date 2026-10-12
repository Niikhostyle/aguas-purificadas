import { Droplets } from "lucide-react";
import { NeutralBenefits } from "@/components/storefront/neutral-benefits";
import { Reveal } from "@/components/storefront/reveal";
import type { BenefitItem } from "@/lib/modules";

function gridCols(count: number): string {
  if (count <= 2) return "sm:grid-cols-2 max-w-4xl mx-auto";
  if (count === 4 || count >= 7) return "sm:grid-cols-2 lg:grid-cols-4";
  return "sm:grid-cols-2 lg:grid-cols-3";
}

/** Tenant-configured benefits (Admin → Beneficios); generic copy until the tenant adds its own. */
export function BenefitsSection({ title, items }: { title?: string; items: BenefitItem[] }) {
  if (!items.length) return <NeutralBenefits title={title} />;

  return (
    <section
      id="beneficios"
      className="bg-[linear-gradient(180deg,var(--mist)_0%,#fff_100%)] py-16 md:py-20"
    >
      <Reveal className="mx-auto max-w-6xl px-4 md:px-6">
        <h2 className="sf-title rc-display text-center text-4xl uppercase text-[var(--brand-deep)] md:text-5xl">
          {title || "¿Por qué elegirnos?"}
        </h2>
        <ul className={`mt-12 grid gap-6 ${gridCols(items.length)}`}>
          {items.map((item) => (
            <li key={item.id} className="sf-card sf-card-hover group overflow-hidden">
              {item.imageUrl ? (
                <div className="overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.imageUrl}
                    alt=""
                    loading="lazy"
                    className="aspect-[16/10] w-full object-cover transition duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
                  />
                </div>
              ) : null}
              <div className={item.imageUrl ? "p-5 pt-4" : "p-6"}>
                {item.imageUrl ? null : (
                  <span className="mb-5 flex size-12 items-center justify-center rounded-xl bg-[linear-gradient(135deg,var(--brand)_0%,var(--brand-deep)_100%)] text-white shadow-[0_8px_18px_-8px_var(--brand)] ring-4 ring-[var(--mist)] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-rotate-6 group-hover:scale-105">
                    <Droplets className="size-6" aria-hidden />
                  </span>
                )}
                <h3 className="rc-display text-2xl uppercase text-[var(--brand-deep)]">{item.title}</h3>
                {item.body ? (
                  <p className="mt-2 text-sm leading-relaxed text-[#5a6578]">{item.body}</p>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </Reveal>
    </section>
  );
}
