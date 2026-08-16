"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Icon } from "@tecni/ui";

export interface ProductCoverflowItem {
  id: string;
  slug: string;
  name: string;
  imageUrl: string | null;
}

/**
 * Sexta excepción real del proyecto a "Server Components por defecto"
 * (ver hero-carousel.tsx, category-carousel.tsx, roi-calculator.tsx,
 * catalog-nav-dropdown.tsx, category-hero-carousel.tsx para las otras
 * cinco): selector interactivo de producto — flechas cambian cuál está
 * centrado, sin navegar; el clic en la imagen o en la pestaña sí navega.
 * Benchmark verificado en vivo en es.hunter.com/es-int/maquinas-de-
 * alineacion/ (docs/tasks/done/DONE-hero-coverflow-producto.md): fondo
 * oscuro con foco de luz, producto centrado completo (`object-contain`,
 * nunca recortado), vecinos borrosos a los lados. Sin `prefers-reduced-
 * motion`, la transición de blur/escala se desactiva.
 */
export function ProductCoverflowHero({ products }: { products: ProductCoverflowItem[] }) {
  const [index, setIndex] = useState(0);
  const reducedMotionRef = useRef(false);

  useEffect(() => {
    reducedMotionRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  if (products.length === 0) return null;

  const count = products.length;
  // Non-null: `count` > 0 (retorno anticipado arriba) y el módulo
  // siempre cae dentro de [0, count).
  const at = (offset: number): ProductCoverflowItem => products[(index + offset + count) % count]!;
  const goTo = (next: number) => setIndex((next + count) % count);
  const transitionClass = reducedMotionRef.current ? "" : "transition-all duration-500";

  const active = at(0);

  return (
    <div className="relative overflow-hidden pt-8 md:pt-12">
      <div className="relative mx-auto flex h-[380px] max-w-[1280px] items-center justify-center md:h-[560px]">
        {count > 1 ? (
          <>
            <ProductGhost item={at(-1)} className={`left-[-2%] md:left-[2%] ${transitionClass}`} />
            <ProductGhost item={at(1)} className={`right-[-2%] md:right-[2%] ${transitionClass}`} />
          </>
        ) : null}

        <Link
          href={`/catalogo/${active.slug}`}
          aria-label={`Ver ${active.name}`}
          className={`relative z-10 flex h-[92%] w-[68%] items-center justify-center md:w-[48%] ${transitionClass}`}
        >
          {active.imageUrl ? (
            <img src={active.imageUrl} alt={active.name} className="h-full w-full object-contain" />
          ) : (
            <Icon name="box" size={96} className="text-border-strong" />
          )}
        </Link>

        {count > 1 ? (
          <>
            <button
              type="button"
              onClick={() => goTo(index - 1)}
              aria-label="Producto anterior"
              className="absolute left-3 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white transition-colors hover:bg-black/60 focus-visible:outline-2 focus-visible:outline-brand md:left-6"
            >
              <Icon name="chevronLeft" size={22} />
            </button>
            <button
              type="button"
              onClick={() => goTo(index + 1)}
              aria-label="Producto siguiente"
              className="absolute right-3 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white transition-colors hover:bg-black/60 focus-visible:outline-2 focus-visible:outline-brand md:right-6"
            >
              <Icon name="chevronRight" size={22} />
            </button>
          </>
        ) : null}
      </div>

      {count > 1 ? (
        <div className="relative z-10 flex flex-wrap items-center justify-center gap-2 px-4 pb-10 pt-6 md:pb-14">
          {products.map((product, i) => (
            <Link
              key={product.id}
              href={`/catalogo/${product.slug}`}
              onMouseEnter={() => setIndex(i)}
              onFocus={() => setIndex(i)}
              className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wide transition-colors focus-visible:outline-2 focus-visible:outline-brand md:text-sm ${
                i === index
                  ? "border-brand bg-brand text-text-inverse"
                  : "border-border-inverse text-text-inverse-muted hover:border-text-inverse-muted hover:text-text-inverse"
              }`}
            >
              {product.name}
            </Link>
          ))}
        </div>
      ) : (
        <div className="pb-10 md:pb-14" />
      )}
    </div>
  );
}

function ProductGhost({ item, className }: { item: ProductCoverflowItem; className: string }) {
  return (
    <div
      className={`pointer-events-none absolute top-1/2 z-0 h-[36%] w-[20%] -translate-y-1/2 opacity-30 blur-md md:w-[14%] ${className}`}
      aria-hidden="true"
    >
      {item.imageUrl ? (
        <img src={item.imageUrl} alt="" className="h-full w-full object-contain" />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <Icon name="box" size={40} className="text-border-strong" />
        </div>
      )}
    </div>
  );
}
