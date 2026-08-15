"use client";

import { useRef } from "react";
import Link from "next/link";
import { CategoryHeroCard, Icon, type IconName } from "@tecni/ui";

export interface CategoryCarouselItem {
  id: string;
  slug: string;
  name: string;
  imageUrl: string | null;
  meta: string;
  icon: IconName;
}

/**
 * Tercera excepción real del proyecto a "Server Components por defecto"
 * (ver roi-calculator.tsx y hero-carousel.tsx para las otras dos): las
 * flechas necesitan `scrollBy` sobre una ref del contenedor. El scroll en
 * sí es nativo (`overflow-x-auto` + `scroll-snap`), navegable por teclado
 * y gesto sin depender de JS — las flechas son un atajo, no el único
 * camino. Reemplaza el grid estático de "Explora por categoría" por un
 * carrusel horizontal, benchmark es.hunter.com (docs/02-DESIGN-SYSTEM.md
 * sección 4, sección "PRODUCTOS HUNTER").
 */
export function CategoryCarousel({ items }: { items: CategoryCarouselItem[] }) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  const scrollByCard = (direction: 1 | -1) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const card = scroller.querySelector<HTMLElement>("[data-carousel-item]");
    const cardWidth = card ? card.offsetWidth + 24 : scroller.clientWidth * 0.8;
    scroller.scrollBy({ left: direction * cardWidth, behavior: "smooth" });
  };

  return (
    <div className="relative">
      <div
        ref={scrollerRef}
        className="flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth pb-2"
        style={{ scrollbarWidth: "none" }}
      >
        {items.map((item) => (
          <div
            key={item.id}
            data-carousel-item
            className="w-[calc(50%-12px)] flex-none snap-start sm:w-[calc(33.333%-16px)] lg:w-[calc(25%-18px)]"
          >
            {item.imageUrl ? (
              <CategoryHeroCard
                href={`/catalogo?categoria=${item.slug}`}
                imageUrl={item.imageUrl}
                name={item.name}
                meta={item.meta}
              />
            ) : (
              <Link
                href={`/catalogo?categoria=${item.slug}`}
                className="group flex aspect-[4/3] flex-col items-start justify-center gap-3 rounded-[var(--radius)] border border-border bg-surface p-6 transition-all hover:border-brand hover:shadow-md"
              >
                <span className="rounded-full bg-brand-subtle p-3">
                  <Icon name={item.icon} size={24} className="text-brand" />
                </span>
                <h3 className="font-semibold text-text">{item.name}</h3>
                <span className="text-sm text-text-muted">{item.meta}</span>
              </Link>
            )}
          </div>
        ))}
      </div>

      {items.length > 1 ? (
        <>
          <button
            type="button"
            onClick={() => scrollByCard(-1)}
            aria-label="Categoría anterior"
            className="absolute -left-4 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-surface text-text shadow-md transition-colors hover:border-brand hover:text-brand focus-visible:outline-2 focus-visible:outline-brand md:flex"
          >
            <Icon name="chevronLeft" size={22} />
          </button>
          <button
            type="button"
            onClick={() => scrollByCard(1)}
            aria-label="Siguiente categoría"
            className="absolute -right-4 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-surface text-text shadow-md transition-colors hover:border-brand hover:text-brand focus-visible:outline-2 focus-visible:outline-brand md:flex"
          >
            <Icon name="chevronRight" size={22} />
          </button>
        </>
      ) : null}
    </div>
  );
}
