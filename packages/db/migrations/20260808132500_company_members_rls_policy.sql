-- Migración: company_members_rls_policy
-- Aplicada: 2026-08-08, vía mcp__Supabase__apply_migration sobre el
-- proyecto tecni (sieiprqcvubkmrmvwwik).
-- Exacta a docs/05-RLS-SECURITY.md sección 4. Usa auth_company_ids()
-- (security definer) en vez de una subconsulta directa sobre esta misma
-- tabla — evita recursión infinita (ver doc, advertencia explícita).
-- Al abrir esta política también queda funcional companies_update_own
-- (paso 3.2), que depende de leer company_members.
-- Reversión: drop policy members_read on company_members;

create policy members_read on company_members
for select to authenticated
using (profile_id = auth.uid() or company_id in (select auth_company_ids()) or is_master());
