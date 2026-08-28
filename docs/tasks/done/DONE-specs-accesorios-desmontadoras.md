# Tarea: Estandarizar specs de Desmontadoras + Accesorios

Riesgo: Grande (migración de esquema + RLS + UI). Plan completo en
`/Users/deiber/.claude/plans/robust-humming-hippo.md`.

## Fases

### Fase 1 — Migración: especificaciones estandarizadas
- [ ] Escribir migración que actualiza 4 definiciones existentes y crea
      4 nuevas para Desmontadoras (ver plan sección 1).
- [ ] Aplicar vía `mcp__Supabase__apply_migration`.
- [ ] Verificar que los productos existentes conservan sus valores.

### Fase 2 — Migración: tabla `product_accessories`
- [ ] Escribir migración (tabla + RLS, clon de `product_benefits`).
- [ ] Aplicar vía `mcp__Supabase__apply_migration`.
- [ ] `get_advisors` para confirmar RLS correcta.

### Fase 3 — Core
- [ ] `packages/core/src/catalog/manage-product-accessory.ts` (clon de
      `manage-product-benefit.ts`).
- [ ] Exportar desde el índice del paquete si aplica.

### Fase 4 — Server Actions
- [ ] `createProductAccessoryAction` / `updateProductAccessoryAction` /
      `deleteProductAccessoryAction` en
      `apps/web/app/(staff)/admin/productos/actions.ts`.

### Fase 5 — Admin UI
- [ ] Sección `#accesorios` en
      `apps/web/app/(staff)/admin/productos/[id]/page.tsx`, clon de
      `#beneficios`.
- [ ] Entrada en `sectionNav`.

### Fase 6 — Ficha pública
- [ ] Cargar `product_accessories` en
      `apps/web/app/(public)/catalogo/[slug]/page.tsx`.
- [ ] Render de sección "Accesorios disponibles" (solo si hay datos).

### Fase 7 — Verificación y cierre
- [ ] `pnpm typecheck && pnpm lint`.
- [ ] Verificación en Chrome (master y anónimo).
- [ ] Actualizar `docs/12-MODULE-CATALOG.md` si aplica.
- [ ] Mover a `done/`, actualizar changelog, commit + push.

## Bitácora

- 2026-08-27: Plan aprobado, tarea creada.
- 2026-08-27: Fase 1 y 2 aplicadas vía `mcp__Supabase__apply_migration`
  sobre el proyecto `tecni`. Verificado con `execute_sql` que los 3
  productos de Desmontadoras (TECNI-301, TECNI-302, TECNIMAX-302)
  conservan sus valores de spec tras el `UPDATE` de definiciones.
  `get_advisors` (security) sin hallazgos nuevos por estas migraciones.
- 2026-08-27: Fase 3-6 implementadas (core, Server Actions, admin UI,
  ficha pública). `pnpm typecheck && pnpm lint` en verde.
- 2026-08-27: Verificación en Chrome como anónimo en
  `/catalogo/tecni-302` — specs muestran los labels nuevos ("Poder",
  "Nivel de ruido", "Diámetro máximo rueda", "Peso neto") con los
  valores intactos, precios ocultos correctamente, página renderiza sin
  errores (sección de accesorios se oculta al no haber ninguno
  cargado). No se pudo verificar el flujo de admin (crear/editar
  accesorio) por falta de credenciales de `master` en este entorno —
  queda pendiente de una verificación manual del usuario en el panel
  `/admin/productos/[id]#accesorios`.
- Cierre: tarea completa, movida a `done/`.
