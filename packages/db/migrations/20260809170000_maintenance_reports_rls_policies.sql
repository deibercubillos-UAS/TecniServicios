-- Migración: maintenance_reports_rls_policies
-- Paso 3.3 (Fase 4, ACTIVE-fase-4-postventa-A.md). Exacta a
-- 05-RLS-SECURITY-C.md. Sin update/delete: el reporte es inmutable
-- (mismo criterio que order_items — corregir es un reporte nuevo).

create policy maintenance_reports_read on maintenance_reports
for select to authenticated
using (request_id in (select id from maintenance_requests));

create policy maintenance_reports_insert_tech on maintenance_reports
for insert to authenticated
with check (
  technician_id = auth.uid()
  and request_id in (select id from maintenance_requests where technician_id = auth.uid())
);
