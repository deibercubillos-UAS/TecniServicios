# TAREA: Imagen "principal" e imagen de "hero de categoría" por separado

**Estado:** Completada · **Riesgo:** Normal
**Inicio:** 2026-08-16 · **Última actualización:** 2026-08-16

## Objetivo

Permitir que desde crear/editar producto en `/admin/productos/[id]` se
elija, además de la imagen principal (`is_primary`, ya existente), una
imagen separada para el hero interactivo de categoría
(`ProductCoverflowHero`) — nueva columna `is_hero` en `product_images`.

**No entra en esta tarea:** cambiar qué imagen usan el grid, la ficha,
el carrito, cotizaciones, home o "mis equipos" — siguen usando
`is_primary` igual que hoy.

Plan completo: `/Users/deiber/.claude/plans/robust-humming-hippo.md`.

---

## Plan

### Fase 1 — Esquema
- [x] **1.1** Migración `is_hero` en `product_images` + backfill desde
      `is_primary`. Verificar RLS con `get_advisors`.
- [x] **1.2** Actualizar `docs/04-DATABASE-SCHEMA-A.md`.

### Fase 2 — `packages/core`
- [x] **2.1** `setHeroProductImage` en `manage-product-image.ts`.
- [x] **2.2** `addProductImage`: primera imagen del producto = hero por
      defecto también.
- [x] **2.3** Test unitario.

### Fase 3 — Panel admin
- [x] **3.1** `setHeroProductImageAction` en `actions.ts`.
- [x] **3.2** Badge + botón "Usar en hero" en `[id]/page.tsx`.

### Fase 4 — Hero de categoría
- [x] **4.1** `categoria/[slug]/page.tsx`: dos Maps (`imageByProduct`
      por `is_primary` para el grid, `heroImageByProduct` por `is_hero`
      para `ProductCoverflowHero`).

## Bitácora

### 2026-08-16 — Inicio
- Plan aprobado por el usuario. Empezando Fase 1.

### 2026-08-16 — Fases 1 a 4 completas
- **Hecho:** migración `20260817090000_product_images_hero_flag.sql`
  aplicada al proyecto `tecni` (backfill verificado: 16 primarias = 16
  heroes, 0 desalineadas). `get_advisors` sin hallazgos nuevos (las
  políticas de fila existentes cubren la columna). Agregadas
  `setHeroProductImage` (core), `setHeroProductImageAction` (server
  action) y botón "Usar en hero" en el admin de producto. La página de
  categoría separa `imageByProduct`/`heroImageByProduct`.
- **Verificación:** `pnpm typecheck`/`lint` en verde, 133 tests de
  `packages/core` en verde (incluye los 2 nuevos de
  `setHeroProductImage`). Build de producción real: sin regresión
  visual con el backfill (hero de categoría igual que antes). Prueba
  extremo a extremo vía SQL directa sobre "Hunter HawkEye Elite®"
  (2 fotos reales): marcar la foto ambiente como `is_hero` sin tocar
  `is_primary` — el hero de categoría cambió a la foto ambiente, la
  ficha del producto siguió mostrando la foto de estudio como
  principal. Dato de prueba revertido a su estado original al cerrar.
  No se probó el botón de la UI admin con clic real (requiere login de
  master; no se manejan contraseñas por política del asistente) — la
  lógica es idéntica al patrón ya probado de "Marcar principal", y el
  efecto en DB se verificó de extremo a extremo por otra vía.
- **Archivos:** ver plan `/Users/deiber/.claude/plans/robust-humming-hippo.md`.
- **Commit:** pendiente (se hace a continuación).

## Bloqueos

Ninguno.
