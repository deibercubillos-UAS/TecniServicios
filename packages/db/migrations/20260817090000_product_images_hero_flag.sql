-- Migración: product_images_hero_flag
-- Aplicada: 2026-08-16, vía mcp__Supabase__apply_migration sobre el
-- proyecto tecni (sieiprqcvubkmrmvwwik).
-- Agrega una bandera independiente de `is_primary` para elegir qué
-- imagen se usa en el hero interactivo de categoría
-- (ProductCoverflowHero) — no siempre la mejor foto de catálogo es la
-- mejor foto de hero. Sin índice único: la exclusividad ("solo una
-- hero por producto") se garantiza en código, mismo patrón que
-- is_primary (ver setPrimaryProductImage / setHeroProductImage en
-- packages/core/src/catalog/manage-product-image.ts).
-- RLS: las políticas existentes de product_images
-- (product_images_read_public, product_images_write_master) son a
-- nivel de fila, cubren la columna nueva sin cambios.
-- Reversión: alter table product_images drop column is_hero;

alter table product_images add column is_hero boolean not null default false;

-- Backfill: toda imagen que hoy es principal queda también como hero
-- por defecto, para no producir una regresión visual al desplegar.
update product_images set is_hero = true where is_primary = true;
