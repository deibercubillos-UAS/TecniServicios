-- Migración: products_rls_policies
-- Aplicada: 2026-08-08, vía mcp__Supabase__apply_migration sobre el
-- proyecto tecni (sieiprqcvubkmrmvwwik).
-- Exacta a 05-RLS-SECURITY.md sección 3. products_read_authenticated no
-- oculta price_cop por columna (RLS restringe filas, no columnas) — la
-- protección de que un anónimo no vea precio es de dos capas: RLS
-- bloquea anon en products por completo, y en el servidor
-- resolvePrice() (packages/core, Fase 5) nunca expone price_cop directo
-- a la UI sin sesión. Grant explícito de select a anon/authenticated en
-- public_products — sin eso la vista no es alcanzable pese a bypassar
-- RLS internamente.
-- Reversión: drop policy products_read_authenticated, products_write_master
--             on products;
--            revoke select on public_products from anon, authenticated;

create policy products_read_authenticated on products
for select to authenticated
using (is_active = true and deleted_at is null);

create policy products_write_master on products
for all to authenticated
using (is_master()) with check (is_master());

grant select on public_products to anon, authenticated;
