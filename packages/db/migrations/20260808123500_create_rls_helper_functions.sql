-- Migración: create_rls_helper_functions
-- Aplicada: 2026-08-08, vía mcp__Supabase__apply_migration sobre el
-- proyecto tecni (sieiprqcvubkmrmvwwik).
-- Usadas en todas las políticas RLS de la Fase 3. No reemplazar
-- auth_company_ids() por una subconsulta directa sobre company_members
-- en la política de esa misma tabla: es security definer justo para
-- evitar la recursión infinita (ver docs/05-RLS-SECURITY.md sección 4).
-- Reversión: drop function auth_role(), auth_company_ids(), is_master();

create or replace function auth_role() returns user_role
language sql stable security definer set search_path = public as $$
  select role from profiles where id = auth.uid();
$$;

create or replace function auth_company_ids() returns setof uuid
language sql stable security definer set search_path = public as $$
  select company_id from company_members where profile_id = auth.uid();
$$;

create or replace function is_master() returns boolean
language sql stable as $$ select auth_role() = 'master' $$;
