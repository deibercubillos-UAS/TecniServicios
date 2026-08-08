-- Migración: payments_rls_policies
-- Aplicada: 2026-08-08, vía mcp__Supabase__apply_migration sobre el
-- proyecto tecni (sieiprqcvubkmrmvwwik).
-- Paso 3.4 (Fase 3, ACTIVE-fase-3-comercio-A.md). Exacta a
-- 05-RLS-SECURITY-A.md, sección "Comercio". Sin ninguna política de
-- insert/update/delete para authenticated — solo el webhook
-- (service_role, bypassa RLS) escribe.

create policy payments_read on payments
for select to authenticated
using (
  order_id in (select id from orders where company_id in (select auth_company_ids()))
  or is_master()
);
