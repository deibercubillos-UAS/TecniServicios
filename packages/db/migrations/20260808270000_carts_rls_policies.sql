-- Migración: carts_rls_policies
-- Aplicada: 2026-08-08, vía mcp__Supabase__apply_migration sobre el
-- proyecto tecni (sieiprqcvubkmrmvwwik).
-- Paso 3.1 (Fase 3, ACTIVE-fase-3-comercio-A.md). Exacta a
-- 05-RLS-SECURITY-A.md, sección "Comercio". v1 sin carrito anónimo
-- (13-MODULE-COMMERCE.md sección 1).

create policy carts_owner on carts
for all to authenticated
using (company_id in (select auth_company_ids()) or is_master())
with check (company_id in (select auth_company_ids()));

create policy cart_items_owner on cart_items
for all to authenticated
using (cart_id in (select id from carts) or is_master())
with check (cart_id in (select id from carts));
