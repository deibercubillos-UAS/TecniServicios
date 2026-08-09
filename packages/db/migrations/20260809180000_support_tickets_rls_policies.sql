-- Migración: support_tickets_rls_policies
-- Paso 3.4 (Fase 4, ACTIVE-fase-4-postventa-A.md). Exacta a
-- 05-RLS-SECURITY-C.md. seller queda solo lectura (06-AUTH-ROLES.md
-- sección 2, "🔸 lectura") — no tiene política de escritura acá.

create policy support_tickets_read on support_tickets
for select to authenticated
using (
  company_id in (select auth_company_ids())
  or auth_role() in ('technician','seller','master')
);

create policy support_tickets_insert_owner on support_tickets
for insert to authenticated
with check (company_id in (select auth_company_ids()));

create policy support_tickets_write_staff on support_tickets
for update to authenticated
using (auth_role() in ('technician','master'))
with check (auth_role() in ('technician','master'));
