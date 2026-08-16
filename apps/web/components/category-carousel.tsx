"use client";

import { useRef, useState, type MouseEvent, type PointerEvent } from "react";
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

const DRAG_CLICK_THRESHOLD_PX = 5;

/**
 * Tercera excepción real del proyecto a "Server Components por defecto"
 * (ver roi-calculator.tsx y hero-carousel.tsx para las otras dos): las
 * flechas necesitan `scrollBy` sobre una ref del contenedor, y el
 * arrastre con mouse necesita `pointermove`/`pointerup`. El scroll en sí
 * sigue siendo nativo (`overflow-x-auto` + `scroll-snap`), navegable por
 * teclado y gesto táctil sin depender de JS — el arrastre con mouse y las
 * flechas son atajos, no el único camino. Reemplaza el grid estático de
 * "Explora por categoría" por un carrusel horizontal, benchmark
 * es.hunter.com (docs/02-DESIGN-SYSTEM.md sección 4, "PRODUCTOS HUNTER"),
 * incluido el arrastre con mouse de ese carrusel.
 */
export function CategoryCarousel({ items }: { items: CategoryCarouselItem[] }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startX: number; startScrollLeft: number; dragged: boolean } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const scrollByCard = (direction: 1 | -1) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const card = scroller.querySelector<HTMLElement>("[data-carousel-item]");
    const cardWidth = card ? card.offsetWidth + 24 : scroller.clientWidth * 0.8;
    scroller.scrollBy({ left: direction * cardWidth, behavior: "smooth" });
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse") return;
    const scroller = scrollerRef.current;
    if (!scroller) return;
    dragRef.current = { startX: event.clientX, startScrollLeft: scroller.scrollLeft, dragged: false };
    setIsDragging(true);
    scroller.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    const scroller = scrollerRef.current;
    if (!drag || !scroller) return;
    const delta = event.clientX - drag.startX;
    if (Math.abs(delta) > DRAG_CLICK_THRESHOLD_PX) drag.dragged = true;
    scroller.scrollLeft = drag.startScrollLeft - delta;
  };

  const endDrag = () => {
    dragRef.current = null;
    setIsDragging(false);
  };

  const onClickCapture = (event: MouseEvent<HTMLDivElement>) => {
    if (dragRef.current?.dragged) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  return (
    <div className="relative">
      <div
        ref={scrollerRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        onClickCapture={onClickCapture}
        className={`flex snap-x snap-mandatory gap-6 overflow-x-auto pb-2 ${isDragging ? "cursor-grabbing scroll-auto select-none" : "cursor-grab scroll-smooth"}`}
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
                href={`/catalogo/categoria/${item.slug}`}
                imageUrl={item.imageUrl}
                name={item.name}
                meta={item.meta}
              />
            ) : (
              <Link
                href={`/catalogo/categoria/${item.slug}`}
                draggable={false}
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
