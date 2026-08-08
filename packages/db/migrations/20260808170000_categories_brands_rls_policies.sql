-- Migración: categories_brands_rls_policies
-- Aplicada: 2026-08-08, vía mcp__Supabase__apply_migration sobre el
-- proyecto tecni (sieiprqcvubkmrmvwwik).
-- Exacta a 05-RLS-SECURITY.md sección "Contenido público" (patrón
-- posts_read_public aplicado a categories/brands). Lectura anon +
-- authenticated de filas activas, escritura solo master.
-- Reversión: drop policy categories_read_public, categories_write_master
--             on categories;
--            drop policy brands_read_public, brands_write_master on brands;

create policy categories_read_public on categories
for select to anon, authenticated
using (is_active = true);

create policy categories_write_master on categories
for all to authenticated using (is_master()) with check (is_master());

create policy brands_read_public on brands
for select to anon, authenticated
using (is_active = true);

create policy brands_write_master on brands
for all to authenticated using (is_master()) with check (is_master());
