# TAREA: Carrusel arrastrable de categorías + dropdown de "Catálogo"

**Estado:** Completada · **Riesgo:** Normal (dos componentes acotados, sin datos/RLS/precios)
**Inicio:** 2026-08-15 · **Última actualización:** 2026-08-15

## Objetivo

1. `CategoryCarousel` (home) se puede arrastrar con el mouse, igual que el
   carrusel "PRODUCTOS HUNTER" de Hunter — hoy solo se mueve con flechas o
   scroll nativo.
2. El navbar "Catálogo" despliega, al hacer clic, un dropdown con las 6
   categorías reales + un enlace a `/catalogo/categorias` — hoy esa página
   solo era alcanzable desde un link chico en el home.

**No entra en esta tarea:** `CatalogMegaMenu` de tres columnas (descartado
en `DONE-mejoras-frontend-hunter.md`, este dropdown simple es justo lo que
esa decisión recomendaba en su lugar).

## Documentos consultados

- `docs/tasks/done/DONE-mejoras-frontend-hunter.md` — decisión previa de
  descartar el mega-menú para 6 categorías planas.
- `docs/02-DESIGN-SYSTEM.md` sección 9 — checklist de accesibilidad para
  dropdowns (foco, `Escape`, retorno de foco).
- `apps/web/components/category-carousel.tsx`,
  `apps/web/components/site-header.tsx` — código real actual.

## Decisiones tomadas (confirmadas con el usuario vía `AskUserQuestion`)

- 2026-08-15: el arrastre aplica al carrusel de categorías del home, no al
  hero de banners.
- 2026-08-15: el dropdown se activa con clic (no hover) — funciona igual
  en touch.
- 2026-08-15: el dropdown muestra las 6 categorías + enlace a
  `/catalogo/categorias`, no reemplaza el link directo a `/catalogo`.

---

## Plan

### Fase 0 — Housekeeping

- [x] **0.1** Pausar `ACTIVE-import-hunter-pilot.md`, crear este archivo.

### Fase 1 — Arrastre en `CategoryCarousel`

- [x] **1.1** Agregar arrastre con mouse (`pointerdown`/`pointermove`/
      `pointerup`) sobre `scrollerRef`, con umbral anti-clic-accidental.
  - Verificación: `pnpm --filter web typecheck && pnpm --filter web lint`
    en verde. Prueba real de arrastre en navegador (`left_click_drag` de
    600px) confirmada con `scrollLeft` (0 → 628px).

### Fase 2 — Dropdown de "Catálogo"

- [x] **2.1** Nuevo `apps/web/components/catalog-nav-dropdown.tsx`.
- [x] **2.2** Conectado en `site-header.tsx`, con fetch de categorías
      (`getCatalogCategories`, en paralelo con `getUserAndCart`).
  - Verificación: `pnpm --filter web typecheck && pnpm --filter web lint`
    en verde. Prueba real: clic abre el panel con las 6 categorías + "Ver
    todas las categorías" (confirmado por texto real leído del DOM),
    `Escape` cierra y devuelve el foco al botón (confirmado con
    `document.activeElement`).

## Bitácora

### 2026-08-15 — Fases 0 a 2
- **Hecho:** pausada `ACTIVE-import-hunter-pilot.md`; arrastre con mouse
  agregado a `CategoryCarousel`; nuevo `CatalogNavDropdown` conectado en
  `site-header.tsx`, reemplazando el link plano de "Catálogo".
- **Bloqueo de entorno encontrado y resuelto:** el CSP del sitio
  (`middleware.ts`, `script-src 'self' 'nonce-...' 'strict-dynamic'`, sin
  `unsafe-eval`) rompe el *hot-reload* de `next dev` en este entorno local
  (el runtime de refresco de Next usa `eval`, bloqueado por la política).
  No es un bug de esta tarea ni se tocó la configuración de seguridad —
  se verificó en su lugar con `pnpm --filter web build && pnpm --filter
  web start` (modo producción real, sin `eval`), donde todo funcionó sin
  errores de consola.
- **Archivos:** `apps/web/components/category-carousel.tsx`,
  `apps/web/components/catalog-nav-dropdown.tsx` (nuevo),
  `apps/web/components/site-header.tsx`.
- **Resultado:** `pnpm --filter web typecheck` y `pnpm --filter web lint`
  en verde. `pnpm --filter web build` exitoso. Verificación funcional
  completa en modo producción con Chrome (arrastre, apertura/cierre del
  dropdown, foco, navegación).
- **Commit:** pendiente (se hace a continuación).

## Bloqueos

Ninguno.

## Pendientes descubiertos

- El CSP estricto rompe `next dev` localmente (no la app en sí). Si el
  equipo necesita HMR local con esta política activa, sería una tarea
  aparte (ej. relajar CSP solo en `NODE_ENV=development`) — no se tocó
  acá porque es una decisión de seguridad que requiere aprobación
  explícita, fuera del alcance de esta tarea.
