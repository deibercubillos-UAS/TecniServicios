-- Migración: maintenance_requests_rls_policies
-- Paso 3.2 (Fase 4, ACTIVE-fase-4-postventa-A.md). Exacta a
-- 05-RLS-SECURITY-C.md. maintenance_assign_staff separada de
-- maintenance_update_tech porque el vendedor/master necesita poder
-- poner technician_id ANTES de que sea "suyo" (using technician_id =
-- auth.uid() no lo dejaría pasar antes de la asignación).

create policy maintenance_read on maintenance_requests
for select to authenticated
using (
  company_id in (select auth_company_ids())
  or technician_id = auth.uid()
  or company_id in (select id from companies where assigned_seller_id = auth.uid())
  or is_master()
);

create policy maintenance_insert_owner on maintenance_requests
for insert to authenticated
with check (
  company_id in (select auth_company_ids())
  and equipment_id in (select id from owned_equipment where company_id in (select auth_company_ids()))
);

create policy maintenance_update_tech on maintenance_requests
for update to authenticated
using (technician_id = auth.uid() or is_master());

create policy maintenance_assign_staff on maintenance_requests
for update to authenticated
using (auth_role() in ('seller','master'))
with check (auth_role() in ('seller','master'));
