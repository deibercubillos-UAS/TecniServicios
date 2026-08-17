# TAREA: Carrito drawer (mini-cart)

**Estado:** Completa · **Riesgo:** Grande
**Inicio:** 2026-08-16 · **Última actualización:** 2026-08-16

## Objetivo

Construir el carrito tipo drawer (se superpone sobre la página),
inspirado en el mockup de Stitch pero con los tokens reales del
sistema de diseño. La página completa `/carrito` es tarea aparte.

Plan completo: `/Users/deiber/.claude/plans/robust-humming-hippo.md`.

## Plan

- [x] **1** Íconos `minus`/`plus` en `packages/ui/src/icon.tsx`.
- [x] **2** `get-cart-summary.ts` (helper compartido, con imagen de producto) + `carrito/page.tsx` usándolo.
- [x] **3** `drawer-actions.ts` (`getCartDrawerSummaryAction`).
- [x] **4** Fix bug `profile_id`→`company_id` en `site-header.tsx` + `CartTrigger`.
- [x] **5** `CartDrawerProvider` + montaje en `layout.tsx`.
- [x] **6** `CartDrawer` (componente visual completo).
- [x] **7** Ajustar `updateCartItemQuantityAction`/`removeCartItemAction` (revalidatePath en vez de redirect en éxito).

## Bitácora

### 2026-08-16 — Inicio
- Plan aprobado. Empezando Fase 1.

### 2026-08-16 — Cierre
- Las 7 fases implementadas y verificadas: `pnpm typecheck && pnpm lint`
  limpios, `pnpm build` de producción exitoso.
- **Bug real encontrado y corregido durante el build de producción:**
  importar `formatCop` de `@tecni/shared` en `cart-drawer.tsx` (Client
  Component) tiraba abajo TODO el sitio con "Algo salió mal" — el
  barrel `index.ts` de `@tecni/shared` re-exporta `serverEnv` en el
  mismo módulo que `formatCop`, y la validación de env de servidor
  corre como side-effect al importarse, arrastrando esa validación al
  bundle del navegador. `roi-calculator.tsx` (Client Component
  existente) ya tenía este mismo problema resuelto con un `formatCop`
  local — se replicó el mismo patrón en `cart-drawer.tsx` en vez de
  importar del paquete compartido.
- Verificación visual completa en Chrome real con sesión de cliente
  (`cliente@tecni.demo`): abrir el drawer desde `/`, `/catalogo`
  (nunca navega, se superpone); +/- de cantidad y quitar ítem
  (actualiza sin cerrar el drawer, badge del navbar se sincroniza);
  sección "Para cotizar" con productos ≥ umbral (probado insertando un
  ítem de $7.200.000 vía SQL, borrado después de verificar); cierre
  con botón X, click en overlay, y `Escape`; página completa
  `/carrito` sigue funcionando igual tras el refactor a
  `get-cart-summary.ts` compartido.
- Sin cambios de RLS ni migraciones — no aplica `get_advisors`.

## Bloqueos

Ninguno.
