# TAREA: Página "Categorías" con bloques editoriales estilo Hunter

**Estado:** Completada · **Riesgo:** Normal (una ruta nueva, datos ya existentes, sin RLS/precios)
**Inicio:** 2026-08-15 · **Última actualización:** 2026-08-15

## Objetivo

Nueva página `/catalogo/categorias`: una sola ruta con pestañas ancla (una
por categoría real) que saltan a bloques alternados foto grande / texto,
replicando el patrón que el usuario señaló en
`es.hunter.com/es-int/maquinas-de-alineacion/`. Cada bloque enlaza al grid
ya filtrado que existe (`/catalogo?categoria=slug`) — no se duplica lógica
de catálogo.

**No entra en esta tarea:** páginas dedicadas por categoría (descartado,
ver decisión del usuario), tocar el carrusel de categorías del home
(`CategoryCarousel`, ya construido en la tarea anterior), datos o copy
nuevo — solo se usa `categories.description`/`image_url` ya existentes.

## Documentos consultados

- `docs/04-DATABASE-SCHEMA-A.md` sección 4 — `categories` ya tiene
  `description`/`image_url`/`position`, sin cambios de esquema.
- `apps/web/app/(public)/page.tsx` — patrón de fetch de categorías +
  conteo real de productos, se reusa igual.
- `apps/web/app/(public)/catalogo/page.tsx` — el filtro `?categoria=slug`
  ya existe y funciona, no se toca.
- Capturas en vivo de `es.hunter.com/es-int/maquinas-de-alineacion/`
  tomadas en esta conversación.

## Decisiones tomadas (confirmadas con el usuario vía `AskUserQuestion`)

- 2026-08-15: una sola página con las 6 categorías como pestañas ancla (no
  6 páginas separadas) — réplica más fiel del patrón de Hunter.
- 2026-08-15: cada bloque = una categoría real, no una "línea de producto"
  curada aparte.
- 2026-08-15: la barra de pestañas **no queda sticky** (simplificación
  deliberada frente al original, evita pelear con la altura variable de
  `SiteHeader`) — sigue siendo navegación ancla real.

---

## Plan

### Fase 0 — Housekeeping

- [x] **0.1** Pausar `ACTIVE-import-hunter-pilot.md`, crear este archivo.

### Fase 1 — Extraer mapeo de íconos por categoría

- [x] **1.1** Mover `CATEGORY_ICON` de `page.tsx` a `apps/web/lib/category-icons.ts`.
- [x] **1.2** Actualizar el import en `page.tsx`.
  - Verificación: `pnpm --filter web typecheck && pnpm --filter web lint` en verde.

### Fase 2 — Página `/catalogo/categorias`

- [x] **2.1** Creado `apps/web/app/(public)/catalogo/categorias/page.tsx`
      (hero estático + pestañas ancla + bloques alternados por categoría).
- [x] **2.2** Enlace "Ver todas las categorías" en el home, junto al
      título de "Explora por categoría".
  - Verificación: `pnpm --filter web typecheck && pnpm --filter web lint`
    en verde. Visual en `pnpm dev` confirmada: hero, 6 pestañas ancla, 2 con
    foto real (`CategoryHeroCard`-equivalente en bloque grande) y 4 con
    fallback de ícono, alternancia izquierda/derecha por índice. CTA "Ver
    categoría" probado con clic real → navega a
    `/catalogo?categoria=diagnostico` (confirmado con
    `window.location.href`), el filtro real de `/catalogo` se aplica.

## Bitácora

### 2026-08-15 — Fases 0 a 2
- **Hecho:** pausada `ACTIVE-import-hunter-pilot.md`; extraído
  `CATEGORY_ICON` a `apps/web/lib/category-icons.ts`; nueva página
  `/catalogo/categorias` con hero + pestañas ancla + bloques alternados;
  enlace "Ver todas las categorías" agregado en el home.
- **Archivos:** `apps/web/lib/category-icons.ts` (nuevo),
  `apps/web/app/(public)/catalogo/categorias/page.tsx` (nuevo),
  `apps/web/app/(public)/page.tsx`.
- **Resultado:** `pnpm --filter web typecheck` y `pnpm --filter web lint`
  en verde. Verificación visual completa en `pnpm dev` con Chrome,
  incluyendo clic real del CTA confirmando la URL de destino.
- **Commit:** pendiente (se hace a continuación).

## Bloqueos

Ninguno.

## Pendientes descubiertos

- Las 4 categorías sin `image_url` (Elevación, Lubricación, Insumos y
  Consumibles, Herramientas de Taller) se ven con el fallback de ícono
  grande en vez de foto — mismo criterio que el carrusel del home. Si el
  master sube fotos desde `/admin/categorias/[id]`, esta página las toma
  automáticamente sin cambio de código.
