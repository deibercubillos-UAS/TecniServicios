"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Badge, Icon, buttonClass } from "@tecni/ui";

export interface HeroSlide {
  id: string;
  title: string | null;
  imageUrl: string;
  mobileImageUrl: string | null;
  linkUrl: string | null;
}

const AUTOPLAY_MS = 6000;

/**
 * Segunda excepción real del proyecto a "Server Components por
 * defecto" (ver roi-calculator.tsx para la primera): un carrusel de
 * banners necesita temporizador, pausa en hover/foco y controles de
 * teclado — inevitablemente estado de cliente. Respeta
 * prefers-reduced-motion (sin autoplay) y expone controles visibles,
 * nunca solo gesto (docs/02-DESIGN-SYSTEM.md sección 9, WCAG 2.1 AA).
 *
 * Layout dividido — benchmark es.hunter.com (docs/02-DESIGN-SYSTEM.md
 * sección 4): panel de texto fijo (marca, siempre igual) a la
 * izquierda, carrusel de foto real de banners a la derecha. Sin
 * banners, el texto ocupa el ancho completo — nunca una foto de stock
 * inventada en su lugar.
 */
export function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reducedMotionRef = useRef(false);

  useEffect(() => {
    reducedMotionRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => {
    if (slides.length < 2 || paused || reducedMotionRef.current) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % slides.length);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [slides.length, paused]);

  const goTo = (next: number) => setIndex((next + slides.length) % slides.length);

  return (
    <section className="relative overflow-hidden bg-bg-inverse">
      <div className={`mx-auto grid max-w-[1280px] items-center ${slides.length > 0 ? "md:grid-cols-2" : ""}`}>
        <div className="flex flex-col items-start px-4 py-16 md:px-6 md:py-24">
          <Badge>Equipamiento industrial para talleres</Badge>
          <h1 className="mt-8 max-w-xl text-4xl font-extrabold tracking-tight text-text-inverse md:text-6xl">
            Soluciones que <span className="text-brand">construyen confianza</span>
          </h1>
          <p className="mt-6 max-w-lg text-lg text-text-inverse-muted">
            Maquinaria, herramientas, repuestos y consumibles para el sector automotriz en
            Colombia — alineación, balanceo, elevación, diagnóstico y lubricación.
          </p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Link href="/catalogo" className={buttonClass("primary")}>
              Ver catálogo completo
              <Icon name="arrowRight" size={20} />
            </Link>
            <Link href="/contacto" className={buttonClass("secondary")}>
              <Icon name="headset" size={20} />
              Solicitar asesoría
            </Link>
          </div>
        </div>

        {slides.length > 0 ? (
          <div
            className="relative aspect-[4/3] w-full md:aspect-auto md:h-full md:min-h-[440px]"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocus={() => setPaused(true)}
            onBlur={() => setPaused(false)}
            aria-roledescription="carrusel"
            aria-label="Promociones destacadas"
          >
            {slides.map((slide, slideIndex) => {
              const isActive = slideIndex === index;
              const content = (
                <img
                  src={slide.imageUrl}
                  alt={slide.title ?? ""}
                  className="h-full w-full object-cover"
                />
              );
              return (
                <div
                  key={slide.id}
                  className={`absolute inset-0 transition-opacity duration-700 ${isActive ? "opacity-100" : "pointer-events-none opacity-0"}`}
                  aria-hidden={!isActive}
                >
                  {slide.linkUrl ? (
                    <Link href={slide.linkUrl} tabIndex={isActive ? 0 : -1} aria-label={slide.title ?? "Ver más"}>
                      {content}
                    </Link>
                  ) : (
                    content
                  )}
                  {slide.title ? (
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-6 md:p-10">
                      <p className="max-w-xl text-xl font-bold text-white md:text-3xl">{slide.title}</p>
                    </div>
                  ) : null}
                </div>
              );
            })}

            {slides.length > 1 ? (
              <>
                <button
                  type="button"
                  onClick={() => goTo(index - 1)}
                  aria-label="Anterior"
                  className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white transition-colors hover:bg-black/60 focus-visible:outline-2 focus-visible:outline-brand"
                >
                  <Icon name="chevronLeft" size={22} />
                </button>
                <button
                  type="button"
                  onClick={() => goTo(index + 1)}
                  aria-label="Siguiente"
                  className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white transition-colors hover:bg-black/60 focus-visible:outline-2 focus-visible:outline-brand"
                >
                  <Icon name="chevronRight" size={22} />
                </button>

                <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1">
                  {slides.map((slide, slideIndex) => (
                    <button
                      key={slide.id}
                      type="button"
                      onClick={() => goTo(slideIndex)}
                      aria-label={`Ir a la diapositiva ${slideIndex + 1}`}
                      aria-current={slideIndex === index}
                      className="flex h-11 w-8 items-center justify-center focus-visible:outline-2 focus-visible:outline-brand"
                    >
                      <span className={`h-2 rounded-full transition-all ${slideIndex === index ? "w-6 bg-brand" : "w-2 bg-white/60"}`} />
                    </button>
                  ))}
                </div>
              </>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
