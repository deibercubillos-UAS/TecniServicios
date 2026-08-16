"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@tecni/ui";

export interface CategoryHeroCarouselImage {
  id: string;
  url: string;
}

const AUTOPLAY_MS = 6000;

/**
 * Quinta excepción real del proyecto a "Server Components por defecto"
 * (ver hero-carousel.tsx, category-carousel.tsx, roi-calculator.tsx,
 * catalog-nav-dropdown.tsx para las otras cuatro): mismo temporizador +
 * pausa en hover/foco + controles de teclado que `HeroCarousel`, pero en
 * formato full-bleed con el texto superpuesto (overlay) en vez de a un
 * lado — benchmark es.hunter.com, pedido explícito del usuario para
 * `/catalogo/categorias`. Respeta `prefers-reduced-motion` (sin
 * autoplay). El texto (children) se recibe ya armado desde la página —
 * este componente solo resuelve el carrusel de fondo y el degradado.
 */
export function CategoryHeroCarousel({ images, children }: { images: CategoryHeroCarouselImage[]; children: React.ReactNode }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reducedMotionRef = useRef(false);

  useEffect(() => {
    reducedMotionRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => {
    if (images.length < 2 || paused || reducedMotionRef.current) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % images.length);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [images.length, paused]);

  const goTo = (next: number) => setIndex((next + images.length) % images.length);

  return (
    <div
      className="relative aspect-[4/3] w-full overflow-hidden md:aspect-auto md:h-full md:min-h-[360px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      aria-roledescription="carrusel"
    >
      {images.map((image, imageIndex) => (
        <img
          key={image.id}
          src={image.url}
          alt=""
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
            imageIndex === index ? "opacity-100" : "opacity-0"
          }`}
          aria-hidden={imageIndex !== index}
        />
      ))}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ background: "linear-gradient(to top, var(--bg-inverse) 0%, rgba(17,17,17,0.35) 45%, transparent 75%)" }}
      />

      <div className="relative flex h-full flex-col justify-end p-6 md:p-10">{children}</div>

      {images.length > 1 ? (
        <>
          <button
            type="button"
            onClick={() => goTo(index - 1)}
            aria-label="Foto anterior"
            className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white transition-colors hover:bg-black/60 focus-visible:outline-2 focus-visible:outline-brand"
          >
            <Icon name="chevronLeft" size={22} />
          </button>
          <button
            type="button"
            onClick={() => goTo(index + 1)}
            aria-label="Foto siguiente"
            className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white transition-colors hover:bg-black/60 focus-visible:outline-2 focus-visible:outline-brand"
          >
            <Icon name="chevronRight" size={22} />
          </button>

          <div className="absolute bottom-3 right-3 flex items-center gap-1">
            {images.map((image, imageIndex) => (
              <button
                key={image.id}
                type="button"
                onClick={() => goTo(imageIndex)}
                aria-label={`Ir a la foto ${imageIndex + 1}`}
                aria-current={imageIndex === index}
                className="flex h-11 w-8 items-center justify-center focus-visible:outline-2 focus-visible:outline-brand"
              >
                <span className={`h-2 rounded-full transition-all ${imageIndex === index ? "w-6 bg-brand" : "w-2 bg-white/60"}`} />
              </button>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
