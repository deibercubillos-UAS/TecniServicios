-- Migración: product_images_attributes_rls_policies
-- Aplicada: 2026-08-08, vía mcp__Supabase__apply_migration sobre el
-- proyecto tecni (sieiprqcvubkmrmvwwik).
-- Exacta a 05-RLS-SECURITY.md sección "product_images,
-- attribute_definitions, product_attributes". Lectura anon+authenticated
-- vía subconsulta a public_products (no a products directo — mismo
-- problema de encadenamiento de RLS resuelto con auth_company_ids() en
-- la Fase 1). Escritura solo master.
-- Reversión: drop policy product_images_read_public, product_images_write_master
--             on product_images;
--            drop policy attribute_definitions_read_public, attribute_definitions_write_master
--             on attribute_definitions;
--            drop policy product_attributes_read_public, product_attributes_write_master
--             on product_attributes;

create policy product_images_read_public on product_images
for select to anon, authenticated
using (product_id in (select id from public_products));

create policy attribute_definitions_read_public on attribute_definitions
for select to anon, authenticated
using (category_id in (select category_id from public_products));

create policy product_attributes_read_public on product_attributes
for select to anon, authenticated
using (product_id in (select id from public_products));

create policy product_images_write_master on product_images
for all to authenticated using (is_master()) with check (is_master());

create policy attribute_definitions_write_master on attribute_definitions
for all to authenticated using (is_master()) with check (is_master());

create policy product_attributes_write_master on product_attributes
for all to authenticated using (is_master()) with check (is_master());
