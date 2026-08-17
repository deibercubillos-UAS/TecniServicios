# TAREA: Reordenar categorías (master) + renombrar navbar a "Productos"

**Estado:** Completada · **Riesgo:** Normal
**Inicio:** 2026-08-17 · **Última actualización:** 2026-08-17

## Objetivo

Master puede reordenar categorías (subir/bajar) desde
`/admin/categorias`; el link "Catálogo" del navbar pasa a llamarse
"Productos" (sin tocar footer/breadcrumbs/títulos).

Plan completo: `/Users/deiber/.claude/plans/robust-humming-hippo.md`.

## Plan

- [x] **1.1** `moveCategory` en `packages/core`.
- [x] **2.1** `moveCategoryAction`.
- [x] **2.2** `/admin/categorias` lista ordenada con ▲/▼.
- [x] **3.1** Navbar "Catálogo" → "Productos".

## Bitácora

### 2026-08-17 — Inicio
- Plan aprobado. Empezando Fase 1.

### 2026-08-17 — Completa
- **Hecho:** `moveCategory` (swap de `position` con el vecino
  adyacente, sin drag-and-drop — mismo criterio de evitar JS
  client-side del proyecto) + `moveCategoryAction` + lista de una
  columna en `/admin/categorias` (antes grid, ordenada ahora por
  `position` con botones ▲/▼ deshabilitados en los extremos). Navbar
  `catalog-nav-dropdown.tsx:64` cambia el texto visible de "Catálogo" a
  "Productos" (mismo `href` a `/catalogo`); footer, breadcrumbs y
  títulos de página quedan intactos (son otra cosa, confirmado en la
  exploración).
- **Verificación:** `pnpm typecheck`/`lint` en verde, 143 tests de
  `packages/core` en verde (3 nuevos de `moveCategory`: sube, baja, no
  hace nada en el extremo). Build de producción real: navbar muestra
  "PRODUCTOS" correctamente (verificado con zoom en el header). No pude
  hacer clic real en `/admin/categorias` (requiere login de master, no
  manejo contraseñas) — la lógica de reorder está cubierta por los
  tests unitarios y sigue exactamente el patrón ya usado (formularios +
  server actions) de `deleteCategoryAction` en el mismo archivo.
- **Commit:** pendiente (se hace a continuación).

## Bloqueos

Ninguno.
