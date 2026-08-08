-- Migración: harden_rls_helper_functions
-- Aplicada: 2026-08-08, vía mcp__Supabase__apply_migration sobre el
-- proyecto tecni (sieiprqcvubkmrmvwwik).
-- Corrige avisos WARN de get_advisors (paso 2.6 de la Fase 1):
--   - is_master() sin search_path fijo → riesgo de search_path hijacking.
--   - auth_role()/auth_company_ids() ejecutables vía RPC público
--     (/rest/v1/rpc/...) por anon Y authenticated. anon no las necesita
--     nunca (no tiene sesión, no participa en ninguna política RLS de
--     esta tarea) — se revoca. authenticated SÍ las necesita: las
--     políticas de la Fase 3 las invocan como ese rol dentro de USING;
--     revocarle EXECUTE rompería el propio RLS. Queda expuesta también
--     como RPC directo — aceptado, la función solo expone datos del
--     propio usuario autenticado (auth.uid()), no hay fuga entre
--     empresas ni usuarios.
-- Reversión: grant execute on function auth_role(), auth_company_ids()
--             to public, anon;
--            create or replace function is_master() ... sin search_path;

create or replace function is_master() returns boolean
language sql stable set search_path = public as $$ select auth_role() = 'master' $$;

revoke execute on function auth_role() from public, anon;
revoke execute on function auth_company_ids() from public, anon;
grant execute on function auth_role() to authenticated;
grant execute on function auth_company_ids() to authenticated;
