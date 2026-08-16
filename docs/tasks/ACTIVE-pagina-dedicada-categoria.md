# TAREA: Página dedicada por categoría (hero-carrusel + grid), elimina /catalogo/categorias

**Estado:** En curso · **Riesgo:** Grande (nueva ruta + elimina página + actualiza enlaces en ~7 archivos, sin datos/RLS)
**Inicio:** 2026-08-16 · **Última actualización:** 2026-08-16

## Objetivo

Reemplazar `/catalogo/categorias` (pestañas ancla, una página con las 6
categorías) por una página dedicada por categoría en `/catalogo/categoria/
[slug]`, con el hero-carrusel de overlay de texto ya construido + el grid
de productos de esa categoría debajo, en la misma URL — benchmark
`es.hunter.com/es-int/maquinas-de-alineacion/`. El dropdown de "Catálogo"
del navbar y el carrusel de categorías del home llevan ahí directo.

**No entra en esta tarea:** tocar `/catalogo` (grid filtrable con sidebar,
sigue igual). Sin migración — reusa `categories`, `banners`, `public_products`.

## Documentos consultados

- `apps/web/components/category-hero-carousel.tsx` — ya existe, se reusa.
- `apps/web/app/(public)/catalogo/categorias/page.tsx` — página a eliminar,
  referencia del patrón de hero a replicar.
- `apps/web/app/(public)/catalogo/[slug]/page.tsx` — confirma la colisión
  de rutas que obliga a `/catalogo/categoria/[slug]` en vez de
  `/catalogo/[slug]`.

## Decisiones tomadas (confirmadas con el usuario vía `AskUserQuestion`)

- 2026-08-16: URL `/catalogo/categoria/[slug]`.
- 2026-08-16: hero + grid de productos en la misma página.

---

## Plan

### Fase 0 — Housekeeping

- [x] **0.1** Pausar `ACTIVE-import-hunter-pilot.md`, crear este archivo.

### Fase 1 — Nueva página `/catalogo/categoria/[slug]`

- [x] **1.1** Creada la página: hero (carrusel si hay banners, fallback
      estático si no) + grid de productos reales debajo.
  - Verificación: `pnpm typecheck && pnpm lint` en verde. Visual en build
    de producción real: `/catalogo/categoria/alineacion-balanceo` (1
    banner `category_hero` real ya cargado — "HawkEye Elite® de Hunter")
    muestra el carrusel con overlay correctamente, sin flechas/puntos por
    tener una sola foto (comportamiento esperado); `/catalogo/categoria/
    elevacion` (sin banners) cae al fallback estático de ícono. Ambas con
    el grid de productos reales debajo funcionando.

### Fase 2 — Eliminar `/catalogo/categorias` y repuntar enlaces

- [ ] **2.1** Borrar `apps/web/app/(public)/catalogo/categorias/`.
- [ ] **2.2** Actualizar enlaces en: `catalog-nav-dropdown.tsx`,
      `category-carousel.tsx`, `site-footer.tsx`, home `page.tsx`,
      `admin/banners/nuevo/page.tsx`, `admin/banners/[id]/page.tsx`,
      `lib/banner-placement.ts`, `lib/category-icons.ts`.
  - Verificación: `pnpm typecheck && pnpm lint` + navegación real desde
    dropdown y carrusel del home; `/catalogo/categorias` → 404;
    `/catalogo` sin cambios.

## Bitácora

### 2026-08-16 — paso 0.1
- **Hecho:** pausada `ACTIVE-import-hunter-pilot.md`, creado este archivo.
- **Commit:** pendiente.

## Bloqueos

Ninguno.
