-- Migración: ticket_messages_rls_policies
-- Paso 3.5 (Fase 4, ACTIVE-fase-4-postventa-A.md). Exacta a
-- 05-RLS-SECURITY-A.md ("ticket_messages — caso especial") y
-- 05-RLS-SECURITY-C.md. El caso más delicado de esta fase: una nota
-- interna nunca llega al cliente, ni en el conteo.

create policy ticket_messages_read on ticket_messages
for select to authenticated
using (
  (
    is_internal = false
    and ticket_id in (
      select id from support_tickets where company_id in (select auth_company_ids())
    )
  )
  or auth_role() in ('technician','seller','master')
);

create policy ticket_messages_insert_owner on ticket_messages
for insert to authenticated
with check (
  is_internal = false
  and ticket_id in (select id from support_tickets where company_id in (select auth_company_ids()))
);

create policy ticket_messages_insert_staff on ticket_messages
for insert to authenticated
with check (auth_role() in ('technician','seller','master'));
