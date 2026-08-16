# Changelog (parte C)

Parte B (Fase 4 en adelante): [`CHANGELOG-B.md`](./CHANGELOG-B.md)

---

## 2026-08-16 — Imagen "principal" e imagen de "hero de categoría" por separado

Nueva columna `is_hero` en `product_images` (backfill desde
`is_primary`, sin regresión visual al desplegar), función
`setHeroProductImage` en `packages/core` paralela a
`setPrimaryProductImage`, nueva server action y botón "Usar en hero" en
`/admin/productos/[id]` junto al badge/botón existente de "Principal".
La página de categoría (`/catalogo/categoria/[slug]`) ahora construye
dos mapas de imagen por producto: uno por `is_primary` (grid, sin
cambio) y otro por `is_hero` (alimenta `ProductCoverflowHero`). El
resto del sitio (ficha, carrito, cotizaciones, home, "mis equipos")
sigue usando `is_primary` exactamente igual que antes.

Verificado extremo a extremo contra la base real: marcar una foto
distinta como hero para "Hunter HawkEye Elite®" hace que el hero de
categoría muestre la foto ambiente mientras la ficha del producto
sigue mostrando la foto de estudio como principal.

Ver `docs/tasks/done/DONE-imagen-hero-producto.md` para el plan
completo y la bitácora.
