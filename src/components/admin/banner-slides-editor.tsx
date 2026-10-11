"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { TenantHeroSlide } from "@/lib/hero-slides";

type DraftSlide = {
  key: string;
  id: string;
  imageUrl: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
};

function toDraft(slides: TenantHeroSlide[]): DraftSlide[] {
  return slides.map((s, i) => ({
    key: s.id || `s-${i}`,
    id: s.id || `s-${i}`,
    imageUrl: s.imageUrl || "",
    title: s.title || "",
    subtitle: s.subtitle || "",
    ctaLabel: s.ctaLabel || "",
    ctaHref: s.ctaHref || "",
  }));
}

function newSlide(): DraftSlide {
  const id =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `slide-${Date.now()}`;
  return {
    key: id,
    id,
    imageUrl: "",
    title: "",
    subtitle: "",
    ctaLabel: "Ver productos",
    ctaHref: "/productos",
  };
}

export function BannerSlidesEditor({
  initialSlides,
}: {
  initialSlides: TenantHeroSlide[];
}) {
  const [slides, setSlides] = useState<DraftSlide[]>(() =>
    initialSlides.length ? toDraft(initialSlides) : [],
  );
  const formId = useId();

  const update = (key: string, patch: Partial<DraftSlide>) => {
    setSlides((prev) =>
      prev.map((s) => (s.key === key ? { ...s, ...patch } : s)),
    );
  };

  const move = (index: number, dir: -1 | 1) => {
    setSlides((prev) => {
      const next = [...prev];
      const j = index + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[index], next[j]] = [next[j], next[index]];
      return next;
    });
  };

  const payload = slides.map((s) => ({
    id: s.id,
    imageUrl: s.imageUrl,
    title: s.title,
    subtitle: s.subtitle,
    ctaLabel: s.ctaLabel,
    ctaHref: s.ctaHref,
  }));

  return (
    <div className="space-y-4 rounded-lg border border-[#c5dde8] bg-[#f4fafc] p-4">
      <div>
        <h2 className="text-base font-bold text-[var(--brand-deep)]">
          Banners del inicio (carrusel)
        </h2>
        <p className="mt-1 text-sm text-[#5a6578]">
          Una imagen por slide. Podés subir JPG/PNG/WEBP (máx. 5 MB). Si no hay
          slides, la tienda usa banners por defecto.
        </p>
      </div>

      <input
        type="hidden"
        name="heroSlidesJson"
        value={JSON.stringify(payload)}
        readOnly
      />

      {slides.length === 0 ? (
        <p className="text-sm text-[#5a6578]">
          Todavía no hay banners. Agregá el primero para personalizar el
          carrusel.
        </p>
      ) : null}

      <ul className="space-y-4">
        {slides.map((slide, index) => (
          <li
            key={slide.key}
            className="rounded-md border border-[#d5e3ec] bg-white p-4 shadow-sm"
          >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-bold uppercase tracking-wide text-[var(--brand-deep)]">
                Slide {index + 1}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                >
                  Subir
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={index === slides.length - 1}
                  onClick={() => move(index, 1)}
                >
                  Bajar
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setSlides((prev) => prev.filter((s) => s.key !== slide.key))
                  }
                >
                  Quitar
                </Button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-[140px_1fr]">
              <div className="space-y-2">
                <Label>Vista previa</Label>
                <div className="flex aspect-video items-center justify-center overflow-hidden rounded border border-[#e4eef4] bg-[#eef5f8]">
                  {slide.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={slide.imageUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="px-2 text-center text-xs text-[#8a96a8]">
                      Sin imagen
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor={`${formId}-file-${slide.key}`}>
                    Imagen del banner
                  </Label>
                  <Input
                    id={`${formId}-file-${slide.key}`}
                    name={`bannerImage_${slide.id}`}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                  />
                  <Input
                    name={`bannerImageUrl_${slide.id}`}
                    type="hidden"
                    value={slide.imageUrl}
                    readOnly
                  />
                  {slide.imageUrl ? (
                    <p className="truncate text-xs text-[#5a6578]">
                      Actual: {slide.imageUrl}
                    </p>
                  ) : (
                    <p className="text-xs text-amber-700">
                      Subí una imagen para que este slide se muestre.
                    </p>
                  )}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor={`${formId}-title-${slide.key}`}>
                      Título (opcional)
                    </Label>
                    <Input
                      id={`${formId}-title-${slide.key}`}
                      value={slide.title}
                      onChange={(e) =>
                        update(slide.key, { title: e.target.value })
                      }
                      placeholder="Ej. Agua purificada a domicilio"
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor={`${formId}-sub-${slide.key}`}>
                      Subtítulo (opcional)
                    </Label>
                    <Input
                      id={`${formId}-sub-${slide.key}`}
                      value={slide.subtitle}
                      onChange={(e) =>
                        update(slide.key, { subtitle: e.target.value })
                      }
                      placeholder="Texto corto bajo el título"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`${formId}-cta-${slide.key}`}>
                      Botón CTA (texto)
                    </Label>
                    <Input
                      id={`${formId}-cta-${slide.key}`}
                      value={slide.ctaLabel}
                      onChange={(e) =>
                        update(slide.key, { ctaLabel: e.target.value })
                      }
                      placeholder="Ver productos"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`${formId}-href-${slide.key}`}>
                      Botón CTA (URL)
                    </Label>
                    <Input
                      id={`${formId}-href-${slide.key}`}
                      value={slide.ctaHref}
                      onChange={(e) =>
                        update(slide.key, { ctaHref: e.target.value })
                      }
                      placeholder="/productos"
                    />
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <Button
        type="button"
        variant="outline"
        onClick={() => setSlides((prev) => [...prev, newSlide()])}
      >
        + Agregar slide
      </Button>
    </div>
  );
}
