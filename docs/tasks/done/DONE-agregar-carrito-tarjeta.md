# TAREA: Agregar al carrito desde la tarjeta de producto

**Estado:** Completa · **Riesgo:** Normal
**Inicio:** 2026-08-16 · **Última actualización:** 2026-08-17

## Objetivo

Botón "Agregar al carrito" en las tarjetas de producto de las listas
(catálogo, home, categoría, relacionados) sin entrar a la ficha.

Plan completo: `/Users/deiber/.claude/plans/robust-humming-hippo.md`.

## Plan

- [x] **1** `quickAddToCartAction` en `carrito/actions.ts`.
- [x] **2** `AddToCartQuickButton` (cliente, abre el drawer al agregar).
- [x] **3** Cablear en las 4 páginas consumidoras de `ProductCard`.

## Bitácora

### 2026-08-16 — Inicio
- Plan aprobado. Empezando Fase 1.

### 2026-08-17 — Cierre
- Las 3 fases implementadas: `quickAddToCartAction` (sin `redirect`,
  `revalidatePath("/", "layout")` en éxito), `AddToCartQuickButton`
  como hermano del `<Link>` que envuelve `ProductCard` (mismo patrón
  ya usado por `CompareToggle`, cero cambios en `packages/ui`), y
  cableado en las 4 páginas (catálogo, home, categoría, relacionados
  en ficha de producto).
- `pnpm typecheck && pnpm lint` limpios, build de producción exitoso.
- Verificado en Chrome real con `cliente@tecni.demo`:
  - Catálogo: agregar producto de compra directa abre el drawer sin
    navegar; agregar producto ≥$5M cae en "Para cotizar" del drawer,
    igual que si se agregara desde la ficha.
  - Agregar el mismo producto dos veces suma cantidad en la misma
    fila (no duplica) — confirmado vía `cart_items`.
  - Página de categoría: mismo comportamiento confirmado.
  - Ficha de producto (`/catalogo/[slug]`): su propio
    `AddToCartButton`/`addToCartAction` original sigue intacto, no se
    tocó.
  - Sin sesión (cookies limpiadas): el botón no aparece en ninguna
    tarjeta, solo "Inicia sesión para ver precios" — confirmado.
  - Home: sección de bestsellers no tenía datos configurados al
    momento de probar, no se pudo verificar visualmente ahí, pero es
    el mismo patrón exacto ya confirmado en catálogo/categoría.
- Sin cambios de RLS ni migraciones — no aplica `get_advisors`.

## Bloqueos

Ninguno.
