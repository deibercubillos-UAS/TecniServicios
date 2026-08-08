-- Migración: quote_items_insert_owner_policy
-- Aplicada: 2026-08-08, vía mcp__Supabase__apply_migration sobre el
-- proyecto tecni (sieiprqcvubkmrmvwwik).
-- Hallazgo del paso 6.1 (Fase 3, ACTIVE-fase-3-comercio-A.md): la
-- política del paso 3.2 (quote_items_write_staff) solo dejaba escribir
-- quote_items a seller/master — pero el cliente necesita poder cargar
-- los ítems que pide al SOLICITAR la cotización (requestQuote), antes
-- de que haya vendedor asignado. Se agrega una política de insert para
-- la empresa dueña, sin tocar quote_items_write_staff (que sigue
-- controlando quién puede editar/borrar después de creada).

create policy quote_items_insert_owner on quote_items
for insert to authenticated
with check (quote_id in (select id from quotes where company_id in (select auth_company_ids())));
