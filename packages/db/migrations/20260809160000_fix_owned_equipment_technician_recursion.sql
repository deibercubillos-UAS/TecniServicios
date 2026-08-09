-- Migración: fix_owned_equipment_technician_recursion
-- Paso 3.2 (Fase 4, ACTIVE-fase-4-postventa-A.md). Hallazgo real durante
-- la verificación: owned_equipment_read (paso 3.1) consulta
-- maintenance_requests directo para saber si el técnico tiene una
-- solicitud sobre ese equipo, y maintenance_insert_owner (este mismo
-- paso) consulta owned_equipment — el ciclo entre las dos tablas
-- provoca "infinite recursion detected in policy for relation
-- maintenance_requests" en el primer insert real. Mismo problema que ya
-- resolvía auth_company_ids()/auth_role() (security definer) para
-- company_members/profiles — se aplica el mismo patrón acá.

create or replace function auth_assigned_equipment_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select equipment_id from maintenance_requests where technician_id = auth.uid();
$$;

drop policy owned_equipment_read on owned_equipment;

create policy owned_equipment_read on owned_equipment
for select to authenticated
using (
  company_id in (select auth_company_ids())
  or company_id in (select id from companies where assigned_seller_id = auth.uid())
  or id in (select auth_assigned_equipment_ids())
  or is_master()
);
