-- Migración: add_is_bestseller_to_products
-- "Lo más vendido" del home no se calcula de order_items (RLS de
-- pedidos es por empresa, nunca público) — el master selecciona
-- manualmente desde el catálogo qué productos mostrar ahí, igual que
-- is_featured. Mismo patrón exacto: columna en products, expuesta sin
-- cambios en public_products, editable solo por products_write_master
-- (ya aplicada, no se toca).
-- is_bestseller va al final de la vista (no en medio) porque
-- `create or replace view` no permite reordenar columnas existentes.
-- Reversión: alter table products drop column is_bestseller;
--            create or replace view public_products as (versión sin
--            is_bestseller, ver 20260808180000).

alter table products add column is_bestseller boolean not null default false;

create or replace view public_products as
select id, sku, slug, name, short_description, description, type,
       category_id, brand_id, is_active, is_featured, stock_status, created_at,
       is_bestseller
from products
where is_active = true and deleted_at is null;
