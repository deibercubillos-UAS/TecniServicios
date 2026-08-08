-- Migración: companies_rls_policies
-- Aplicada: 2026-08-08, vía mcp__Supabase__apply_migration sobre el
-- proyecto tecni (sieiprqcvubkmrmvwwik).
-- Exacta a docs/05-RLS-SECURITY.md sección 4.
-- companies_update_own depende de una subconsulta directa sobre
-- company_members, que sigue bloqueada (RLS habilitada sin políticas
-- hasta el paso 3.3). Hasta entonces esta política no deja actualizar a
-- nadie (ni siquiera al owner real) — comportamiento esperado y
-- verificado en la prueba de aislamiento del paso 3.2, se cierra en 3.3.
-- Reversión: drop policy companies_read, companies_update_own on companies;

create policy companies_read on companies
for select to authenticated
using (
  id in (select auth_company_ids())
  or assigned_seller_id = auth.uid()
  or is_master()
);

create policy companies_update_own on companies
for update to authenticated
using (
  id in (
    select company_id from company_members
    where profile_id = auth.uid() and member_role in ('owner','accounting')
  ) or is_master()
);
