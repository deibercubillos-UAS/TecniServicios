-- Migración: add_created_at_to_public_products
-- Aplicada: 2026-08-08, vía mcp__Supabase__apply_migration sobre el
-- proyecto tecni (sieiprqcvubkmrmvwwik).
-- Necesario para el paso 7.1 (Fase 2, ACTIVE-fase-2-catalogo-publico-A.md):
-- ordenar el listado público por "más nuevos" sin exponer precio.
-- created_at no es dato sensible.
-- Reversión: recrear la vista sin created_at (ver 05-RLS-SECURITY.md
-- sección 3, versión anterior de la vista).

create or replace view public_products as
select id, sku, slug, name, short_description, description, type,
       category_id, brand_id, is_active, is_featured, stock_status, created_at
from products
where is_active = true and deleted_at is null;
