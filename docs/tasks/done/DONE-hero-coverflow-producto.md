# TAREA: Hero interactivo "coverflow" de productos en la página de categoría

**Estado:** Completada · **Riesgo:** Normal (un componente + editar una página, sin migración)
**Inicio:** 2026-08-16 · **Última actualización:** 2026-08-16

## Objetivo

Reemplazar la vista principal del hero en `/catalogo/categoria/[slug]`
(hoy carrusel de banners con overlay) por un selector interactivo de
producto real, benchmark verificado en vivo en
`es.hunter.com/es-int/maquinas-de-alineacion/`: fondo oscuro con foco de
luz, producto centrado completo (`object-contain`), vecinos borrosos a
los lados, flechas para rotar, pestañas con nombre debajo.

**No entra en esta tarea:** borrar el sistema de banners `category_hero`
(migración/RLS/panel admin de la tarea anterior) — queda como fallback
para categorías sin productos.

## Documentos consultados

- Capturas en vivo de `es.hunter.com/es-int/maquinas-de-alineacion/`
  tomadas en esta conversación (interacción de flechas + pestañas).
- `apps/web/components/category-hero-carousel.tsx` — patrón de carrusel
  existente a seguir (autoplay/foco/`prefers-reduced-motion`, adaptado
  acá sin autoplay).
- `apps/web/app/(public)/catalogo/categoria/[slug]/page.tsx` — página a
  editar, ya trae `products`/`imageByProduct` consultados para el grid.

## Decisiones tomadas (confirmadas con el usuario vía `AskUserQuestion`)

- 2026-08-16: cada ítem = un producto real de la categoría, no una
  "línea de producto" agrupada (no existe ese concepto en el esquema).
- 2026-08-16: fotos tal cual, sin recortar (`object-contain`) — sin PNG
  de fondo transparente por ahora.
- 2026-08-16: clic en imagen central o en pestaña → navega directo a la
  ficha del producto; las flechas solo cambian cuál está centrado.

---

## Plan

### Fase 1 — Componente + integración

- [x] **1.1** Creado `apps/web/components/product-coverflow-hero.tsx`.
- [x] **1.2** Reordenada la lógica del hero en `[slug]/page.tsx`:
      productos reales primero, banners `category_hero` como fallback.
- [x] **1.3** Verificación: `pnpm typecheck && pnpm lint` en verde. Visual
      real en build de producción: categoría con 4 productos (foco de
      luz, producto centrado completo, vecinos borrosos, flechas/pestañas
      funcionando, hover en pestaña previsualiza sin navegar, clic en
      imagen y en pestaña navegan a la ficha real correspondiente —
      confirmado con "Hunter HawkEye Elite®" llegando a
      `/catalogo/hunter-hawkeye-elite`).
  - **Bug real encontrado y corregido:** los "fantasmas" laterales
    (vecinos borrosos) no tenían `pointer-events-none` — un clic cerca
    del borde del centro podía interceptarse por el vecino en vez de
    navegar al producto correcto (se confirmó con un clic que navegó a
    "Balanceadora Hofmann geo" en vez del producto centrado). Corregido
    agregando `pointer-events-none` a `ProductGhost`.
  - **Hallazgo de datos (no es bug):** varios productos (ej. "Alineadora
    Corghi Wheel Aligner Geo") tienen `product_images.url` apuntando a
    `placehold.co` (imagen placeholder con el nombre en texto), no una
    foto real — el componente renderiza correctamente lo que hay; falta
    que el master suba fotos reales para esos productos.

## Bitácora

### 2026-08-16 — Fase 1 completa
- **Hecho:** pausada `ACTIVE-import-hunter-pilot.md`; creado el
  componente `ProductCoverflowHero` y conectado como hero principal de
  `/catalogo/categoria/[slug]` cuando la categoría tiene productos.
- **Archivos:** `apps/web/components/product-coverflow-hero.tsx` (nuevo),
  `apps/web/app/(public)/catalogo/categoria/[slug]/page.tsx`.
- **Resultado:** `pnpm typecheck`/`lint` en verde. Verificación visual
  completa en build de producción con Chrome, incluyendo la navegación
  real por clic confirmada con espera adecuada (la primera vez pareció
  fallar por revisar `window.location.href` antes de que terminara la
  transición cliente de Next.js — no era un bug).
- **Commit:** pendiente (se hace a continuación).

## Bloqueos

Ninguno.
