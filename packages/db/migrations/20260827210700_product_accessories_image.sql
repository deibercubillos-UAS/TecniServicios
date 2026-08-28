-- Migración: product_accessories_image
-- Aplicada: 2026-08-27, vía mcp__Supabase__apply_migration sobre el
-- proyecto tecni (sieiprqcvubkmrmvwwik).
-- El usuario pidió poder agregar una imagen a cada accesorio
-- (product_accessories, ver 20260827205300_product_accessories.sql).
-- Una sola foto por accesorio, mismo patrón que categories.image_url /
-- brands.logo_url — no una galería como product_images, porque un
-- accesorio es un ítem simple de lista, no una ficha propia.
-- Reversión: alter table product_accessories drop column image_url;

alter table product_accessories add column image_url text;
