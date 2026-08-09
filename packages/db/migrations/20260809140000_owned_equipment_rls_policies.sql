-- Migración: owned_equipment_rls_policies
-- Paso 3.1 (Fase 4, ACTIVE-fase-4-postventa-A.md). Exacta a
-- 05-RLS-SECURITY-C.md. Sin insert/update para authenticated salvo
-- master — la creación real la hace service_role desde
-- markOrderDelivered() (paso 4.1).

create policy owned_equipment_read on owned_equipment
for select to authenticated
using (
  company_id in (select auth_company_ids())
  or company_id in (select id from companies where assigned_seller_id = auth.uid())
  or id in (select equipment_id from maintenance_requests where technician_id = auth.uid())
  or is_master()
);

create policy owned_equipment_write_master on owned_equipment
for all to authenticated
using (is_master())
with check (is_master());
