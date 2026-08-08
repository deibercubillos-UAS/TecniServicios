-- Migración: quotes_rls_policies
-- Aplicada: 2026-08-08, vía mcp__Supabase__apply_migration sobre el
-- proyecto tecni (sieiprqcvubkmrmvwwik).
-- Paso 3.2 (Fase 3, ACTIVE-fase-3-comercio-A.md). Exacta a
-- 05-RLS-SECURITY-A.md, sección "Comercio". El cliente nunca
-- actualiza su propia cotización.

create policy quotes_read on quotes
for select to authenticated
using (company_id in (select auth_company_ids()) or seller_id = auth.uid() or is_master());

create policy quotes_insert on quotes
for insert to authenticated
with check (company_id in (select auth_company_ids()) or auth_role() in ('seller','master'));

create policy quotes_update_staff on quotes
for update to authenticated
using (seller_id = auth.uid() or is_master());

create policy quote_items_read on quote_items
for select to authenticated
using (quote_id in (select id from quotes));

create policy quote_items_write_staff on quote_items
for all to authenticated
using (quote_id in (select id from quotes where seller_id = auth.uid()) or is_master())
with check (quote_id in (select id from quotes where seller_id = auth.uid()) or is_master());
