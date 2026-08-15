# TAREA: Navbar, hero y sección de categorías al estilo Hunter Engineering

**Estado:** Completada · **Riesgo:** Grande (tres pantallas del home, varios archivos, sin datos/RLS/precios)
**Inicio:** 2026-08-15 · **Última actualización:** 2026-08-15

## Objetivo

Acercar tres piezas concretas del home al look de es.hunter.com, benchmark ya
documentado en `docs/02-DESIGN-SYSTEM.md` sección 4 / `docs/03-UI-
COMPONENTS.md` sección 3:

1. Header/navbar: quitar el borde inferior rojo grueso, enlaces en
   mayúsculas (misma tipografía), carrito + cuenta + "Cerrar sesión" en rojo
   sólido como el "CONTACTO" de Hunter.
2. Hero: layout dividido — texto fijo a la izquierda, carrusel de foto real
   a la derecha.
3. "Explora por categoría": grid estático → carrusel horizontal con
   flechas, como "PRODUCTOS HUNTER" en la home de Hunter.

**No entra en esta tarea:** cambio de paleta o tipografía (Montserrat se
mantiene), `CatalogMegaMenu` (ya descartado en `DONE-mejoras-frontend-
hunter.md`, sin categorías suficientes), datos nuevos de categorías/fotos.

## Documentos consultados

- `docs/02-DESIGN-SYSTEM.md` secciones 1, 2, 4, 8 — tokens, tipografía,
  reglas de implementación.
- `docs/03-UI-COMPONENTS.md` sección 3 — spec de `CategoryHeroCard` (ya
  implementado, se reusa tal cual en la Fase 3).
- `apps/web/components/site-header.tsx`, `apps/web/components/hero-
  carousel.tsx`, `apps/web/app/(public)/page.tsx` — código real actual.
- `packages/ui/src/button.tsx` — `buttonClass("primary")` ya es rojo sólido,
  se reusa para "Cerrar sesión".
- `docs/tasks/done/DONE-mejoras-frontend-hunter.md` — trabajo previo sobre
  el mismo benchmark, confirma que `CategoryHeroCard` ya existe y solo
  falta el layout de carrusel.

## Plan

### Fase 0 — Housekeeping

- [x] **0.1** Pausar `ACTIVE-import-hunter-pilot.md` y crear este archivo.

### Fase 1 — Navbar / header

- [x] **1.1** Quitar `border-b-4 border-brand` del header.
- [x] **1.2** Enlaces de `NAV_LINKS` en mayúsculas (`uppercase tracking-wide font-bold`).
- [x] **1.3** "Cerrar sesión" pasa de outline a `buttonClass("primary")` (rojo sólido).
  - Verificación: `pnpm --filter web typecheck && pnpm --filter web lint` en verde. Visual en `pnpm dev` confirmado (anónimo): sin borde rojo, nav en mayúsculas, carrito visible, CTA "Iniciar sesión" rojo sólido.

### Fase 2 — Hero dividido

- [x] **2.1** `HeroCarousel` a layout de dos columnas (texto fijo + carrusel de imagen).
- [x] **2.2** Fallback sin banners: mismo panel de texto a ancho completo (confirmado visualmente — sin `home_hero` banners en el entorno local, el hero cae a texto completo, un solo `h1`, sin foto inventada).
- [x] **2.3** Quitar la "franja de identidad" duplicada en `page.tsx`.
  - Verificación: `pnpm --filter web typecheck && pnpm --filter web lint` en verde. Visual confirmada sin banners (caso con banners no probado en este entorno por falta de datos en `home_hero`, mismo componente y lógica que ya funcionaba).

### Fase 3 — Carrusel de categorías

- [x] **3.1** Nuevo `CategoryCarousel` — **desviación del plan:** se creó en
      `apps/web/components/` en vez de `packages/ui/src/`, porque necesita
      estado de cliente (`useRef`/`onClick` para las flechas) y `packages/ui`
      no tiene hoy ningún componente `"use client"` (convención existente:
      los componentes con estado de cliente viven en `apps/web/components/`,
      ver `roi-calculator.tsx` y `hero-carousel.tsx`). Reusa `CategoryHeroCard`
      de `@tecni/ui` sin modificarlo.
- [x] **3.2** Reemplazado el grid de "Explora por categoría" en `page.tsx` por `<CategoryCarousel />`.
  - Verificación: `pnpm --filter web typecheck && pnpm --filter web lint` en verde. Visual confirmada con las 6 categorías reales (2 con foto real usan `CategoryHeroCard`, 4 sin foto caen al fallback de ícono). Flecha "Siguiente categoría" probada con clic real — el carrusel avanza una tarjeta (`scrollLeft` 0 → 314px, ancho real de tarjeta + gap).

## Bitácora

### 2026-08-15 — Fases 0 a 3
- **Hecho:** pausada `ACTIVE-import-hunter-pilot.md`; header sin borde rojo
  y nav en mayúsculas con CTA de logout rojo; hero rediseñado a layout
  dividido (texto fijo + carrusel de imagen), eliminada la franja de
  identidad duplicada; nuevo `CategoryCarousel` reemplazando el grid de
  categorías.
- **Bloqueo local resuelto (no relacionado con el código de esta tarea):**
  `apps/web/.env.local` tenía `R2_PUBLIC_URL="assets.tecnisas.co"` sin
  esquema (mismo bug ya corregido en Vercel en el incidente de
  `DONE-mejoras-frontend-hunter.md`/`ACTIVE-import-hunter-pilot.md`, pero
  nunca sincronizado a este `.env.local` local). Se corrigió a
  `"https://assets.tecnisas.co"` solo en el archivo local (gitignorado, sin
  tocar Vercel) para poder levantar `pnpm dev` y verificar visualmente.
- **Archivos:** `apps/web/components/site-header.tsx`,
  `apps/web/components/hero-carousel.tsx`,
  `apps/web/components/category-carousel.tsx` (nuevo),
  `apps/web/app/(public)/page.tsx`.
- **Resultado:** `pnpm --filter web typecheck` y `pnpm --filter web lint`
  en verde. Verificación visual completa en `pnpm dev` con Chrome
  (navbar, hero sin banners, carrusel de categorías con clic real de
  flecha confirmado por `scrollLeft`).
- **Commit:** pendiente (se hace a continuación).

## Bloqueos

Ninguno.

## Pendientes descubiertos

- El caso del hero **con** banners reales (`home_hero` con filas activas)
  no se verificó visualmente en este entorno porque la tabla está vacía en
  los datos locales — el componente reusa la misma lógica de carrusel que
  ya funcionaba antes de este cambio, solo confirmar visualmente en el
  preview de Vercel o en producción tras publicar.
- `R2_PUBLIC_URL` en `.env.local` estaba desactualizado respecto al valor
  correcto ya corregido en Vercel — si otro desarrollador clona el repo y
  usa `vercel env pull`, debería traer el valor correcto; si alguien más
  tiene un `.env.local` viejo como el que se encontró acá, verá el mismo 500.
