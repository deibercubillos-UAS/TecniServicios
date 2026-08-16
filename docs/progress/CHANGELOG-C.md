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

## 2026-08-16 — Reorganiza la edición de producto en el panel maestro

`/admin/productos/[id]` pasa de 7 secciones siempre expandidas (mucho
scroll, sin forma de ver de un vistazo qué faltaba) a: un menú de
anclas arriba, "Datos básicos" con sus 4 checkboxes reagrupados en 3
bloques claros (Tipo de contenido / Visibilidad / Destacados en el
sitio), y el resto de secciones (Imágenes, Especificaciones, Video,
Beneficios, Manual, Zona de peligro) como `<details>/<summary>` nativo
con resumen de estado (ej. "Imágenes (4)", "Especificaciones
(6/12 completas)") — sin JavaScript, mismo patrón ya usado en
`admin/auditoria`, evitando una séptima excepción a "Server Components
por defecto". Cada sección se abre sola cuando está incompleta o tras
guardar algo en ella; "Zona de peligro" siempre cerrada por defecto.

Ver `docs/tasks/done/DONE-reorganizar-edicion-producto.md` para el
plan completo y la bitácora.
