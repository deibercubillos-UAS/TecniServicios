# TAREA: Página dedicada por categoría (hero-carrusel + grid), elimina /catalogo/categorias

**Estado:** Completada · **Riesgo:** Grande (nueva ruta + elimina página + actualiza enlaces en ~7 archivos, sin datos/RLS)
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

- [x] **2.1** Borrada `apps/web/app/(public)/catalogo/categorias/`.
- [x] **2.2** Actualizados los enlaces en: `catalog-nav-dropdown.tsx`
      (categorías → página dedicada, "Ver todas las categorías" →
      "Ver catálogo completo" a `/catalogo`), `category-carousel.tsx`
      (cards → página dedicada), `site-footer.tsx` (se corrigió de paso
      un duplicado de "Catálogo" en `SITEMAP_LINKS`), home `page.tsx`
      (se quita el link "Ver todas las categorías", sin destino ya),
      `admin/banners/nuevo/page.tsx` y `[id]/page.tsx` (opciones de
      "Enlace" de categoría → página dedicada), `lib/banner-placement.ts`
      y `lib/category-icons.ts` (comentarios/descripciones actualizados).
  - Verificación: `pnpm typecheck && pnpm lint` en verde (se limpió
    `.next` primero — quedaban tipos generados stale referenciando la
    ruta borrada). Build de producción real: `/catalogo/categorias` → 404
    confirmado; `/catalogo` sigue en 200 sin cambios; navegación real en
    Chrome desde el dropdown del navbar ("Alineación y Balanceo") y desde
    el carrusel de categorías del home (card "Diagnóstico") — ambas
    confirmadas llegando a `/catalogo/categoria/[slug]` vía
    `window.location.href`.

## Bitácora

### 2026-08-16 — paso 0.1
- **Hecho:** pausada `ACTIVE-import-hunter-pilot.md`, creado este archivo.
- **Commit:** pendiente.

## Bloqueos

Ninguno.
