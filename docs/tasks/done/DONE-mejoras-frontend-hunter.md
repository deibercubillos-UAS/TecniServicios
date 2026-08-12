# TAREA: Mejoras de frontend inspiradas en benchmark Hunter Engineering

**Estado:** Completada · **Riesgo:** Normal (Fase 1 y 2) / Grande — Fase 3 descartada, no se ejecutó
**Inicio:** 2026-08-11 · **Última actualización:** 2026-08-11

## Objetivo

Aplicar al frontend real los patrones visuales identificados al auditar
es.hunter.com/es-int (ver `docs/02-DESIGN-SYSTEM.md` sección 4 y
`docs/03-UI-COMPONENTS.md` sección 3): hero oscuro en ficha de producto,
card de categoría con overlay, barra sticky de CTA en ficha, mega-menú de
catálogo.

**No entra en esta tarea:** rediseño de home (ya migrada de Stitch y
auditada en Fase 2), cambios de paleta o tipografía (el benchmark confirmó
la dirección actual, no la cambia).

## Documentos consultados

- `docs/02-DESIGN-SYSTEM.md` sección 4 — patrones adoptados del benchmark
- `docs/03-UI-COMPONENTS.md` sección 3 — spec de los 3 componentes nuevos
- `apps/web/components/site-header.tsx` — header real, nav plana actual
- `packages/ui/src/button.tsx` — `secondary` ya es outline-sobre-oscuro,
  no hace falta variante nueva

## Decisiones tomadas durante la ejecución

- 2026-08-11: el mega-menú (Fase 3) se implementa último y solo si el
  número real de categorías lo justifica — evita construir un componente
  de tres columnas para 4 categorías. Se revisa el conteo real en
  `packages/core` antes de empezar esa fase.

---

## Plan

### Fase 1 — Documentación (hecho en esta sesión)

- [x] **1.1** Documentar los 5 hallazgos del benchmark en
      `02-DESIGN-SYSTEM.md` sección 4.
  - Verificación: sección visible, sin exceder 500 líneas del archivo.
  - Reversión: `git revert` del commit.
- [x] **1.2** Documentar spec de `CategoryHeroCard`, `StickyProductCta`,
      `CatalogMegaMenu` en `03-UI-COMPONENTS.md` sección 3.
  - Verificación: cada componente tiene comportamiento y reglas de datos
    explícitas, ninguna decisión de diseño librada a quien lo codee.
  - Reversión: `git revert` del commit.

### Fase 2 — `CategoryHeroCard` + `StickyProductCta`

- [x] **2.1** Implementar `CategoryHeroCard` en `packages/ui/src/`,
      consumido en el carrusel de categorías de home y en la cabecera de
      `/catalogo`.
  - Verificación: build + typecheck pasan; visual en `pnpm dev` igual al
    spec (overlay degradado, sin card blanca).
  - Reversión: quitar el import y volver al componente anterior.
  - **Bloqueo real encontrado y resuelto:** `categories` no tenía foto
    (solo `icon_url`, sin cargar). Con visto bueno del usuario se agregó
    `categories.image_url` (migración
    `20260811100000_add_image_url_to_categories.sql`, aplicada al
    proyecto Supabase), subida a R2 en `/admin/categorias/[id]`
    (`uploadCategoryImageAction`/`deleteCategoryImageAction`,
    `buildCategoryAssetKey`), y `CategoryHeroCard` conectado en la home
    con **fallback a la card de ícono existente** cuando la categoría
    todavía no tiene foto — nunca una foto de stock inventada.
- [x] **2.2** Implementar `StickyProductCta` en
      `apps/web/app/(public)/catalogo/[slug]/page.tsx`, reusando la
      resolución de precio/umbral que ya usa la card de producto (sin
      recalcular en cliente).
  - Verificación: probar en `pnpm dev` como anónimo, como `customer` bajo
    umbral, como `customer` sobre umbral — las 3 vistas de la sección 8 de
    `CLAUDE.md` ("¿qué ve un anónimo? ¿otro rol?").
  - Reversión: quitar el componente de la página, el resto de la ficha
    sigue funcionando igual.
  - **Corrección al spec original:** el umbral de cotización
    (`quote_threshold_cop`) no se evalúa en la ficha de producto — solo
    al armar/pagar el carrito (`splitCartByThreshold` en
    `app/(commerce)/carrito/`). La ficha siempre ofrece "Agregar al
    carrito" si hay precio visible, sin importar el monto. `StickyProductCta`
    replica exactamente eso (3 estados de `resolvePrice` + sesión), no
    inventa una rama de "Solicitar cotización por umbral" que no existe
    en la página real.
  - **Conflicto encontrado y resuelto:** `CompareBar` (global,
    `app/layout.tsx`) también es una barra `fixed bottom` cuando hay 2+
    productos en comparación — se superponía con la nueva barra. Se
    ocultó `StickyProductCta` mientras `CompareBar` esté visible (mismo
    umbral de 2 que usa `compare-bar.tsx`).
  - **Sin verificación visual en navegador** en esta sesión — no hay
    `.env.local` con credenciales de Supabase en este entorno. Verificado
    con `pnpm typecheck`, `pnpm lint` y los 127 tests de `packages/core`.
    Pendiente confirmar visualmente en el preview de Vercel del PR.

### Fase 3 — `CatalogMegaMenu` (condicional) — DESCARTADA

- [x] **3.1** Contar categorías reales activas en la base de datos.
  - Verificación: si son ≤ 6, se descarta esta fase y se anota en
    "Pendientes descubiertos".
  - Resultado 2026-08-11: **6 categorías activas, las 6 de primer nivel
    (`parent_id is null`), sin subcategorías.** Se descarta la fase: un
    mega-menú de tres columnas (categorías | subcategorías | accesos
    rápidos) no tiene qué mostrar en la columna de subcategorías hoy, y
    para 6 ítems planos el dropdown simple que ya existe en
    `site-header.tsx` es más claro que un componente de tres columnas.
    Se revive si el catálogo agrega subcategorías reales o supera ~10
    categorías de primer nivel — no antes.
- [ ] ~~**3.2** Implementar `CatalogMegaMenu`~~ — no aplica, ver 3.1.

---

## Bitácora

### 2026-08-11 — pasos 1.1 y 1.2

- **Hecho:** documentados los hallazgos del benchmark y los 3 componentes
  nuevos.
- **Archivos:** `docs/02-DESIGN-SYSTEM.md`, `docs/03-UI-COMPONENTS.md`.
- **Resultado:** ambos archivos siguen bajo 500 líneas.
- **Commit:** `c996d70`.

### 2026-08-11 — paso 2.1

- **Hecho:** columna `categories.image_url` (migración aplicada al
  proyecto Supabase `sieiprqcvubkmrmvwwik`), `updateCategoryImage` en
  `packages/core`, `buildCategoryAssetKey` en `packages/integrations`,
  subida/borrado de foto en `/admin/categorias/[id]`, componente
  `CategoryHeroCard` en `packages/ui`, conectado en la home con fallback
  a la card de ícono cuando no hay foto.
- **Archivos:** `packages/db/migrations/20260811100000_add_image_url_to_categories.sql`,
  `packages/core/src/catalog/manage-category.ts`, `packages/core/src/index.ts`,
  `packages/integrations/src/r2/client.ts`, `packages/integrations/src/index.ts`,
  `packages/ui/src/category-hero-card.tsx`, `packages/ui/src/index.ts`,
  `apps/web/app/(staff)/admin/categorias/actions.ts`,
  `apps/web/app/(staff)/admin/categorias/[id]/page.tsx`,
  `apps/web/app/(public)/page.tsx`, `docs/04-DATABASE-SCHEMA-A.md`,
  `docs/11-STORAGE-R2.md`.
- **Resultado:** `pnpm typecheck`, `pnpm lint` y `pnpm --filter @tecni/core test` en verde (127/127).
  No hubo verificación visual en navegador en esta sesión (sin foto real
  cargada todavía en ninguna categoría — el fallback de ícono es lo que
  se ve hasta que el master suba la primera foto).
- **Commit:** pendiente.

---

## Bloqueos

- Ninguno.

## Pendientes descubiertos

- `CatalogMegaMenu` queda sin construir (Fase 3 descartada, ver
  bitácora). Revisar de nuevo si el catálogo suma subcategorías reales o
  pasa de ~10 categorías de primer nivel — pasar a `progress/TODO.md` si
  se decide retomarlo más adelante.
- Ninguna categoría tiene `image_url` cargada todavía — `CategoryHeroCard`
  está listo pero invisible hasta que el master suba al menos una foto
  desde `/admin/categorias/[id]`.
- `StickyProductCta` no se verificó visualmente en navegador en esta
  sesión (sin `.env.local` con credenciales de Supabase) — confirmar en
  el preview de Vercel.
