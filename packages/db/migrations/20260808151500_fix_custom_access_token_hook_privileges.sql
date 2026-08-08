-- Migración: fix_custom_access_token_hook_privileges
-- Aplicada: 2026-08-08, vía mcp__Supabase__apply_migration sobre el
-- proyecto tecni (sieiprqcvubkmrmvwwik).
-- Corrige un fallo real detectado en CI (paso 8.1): custom_access_token_hook
-- no era security definer, así que corría con los privilegios de
-- supabase_auth_admin (el rol que Supabase Auth usa para invocar hooks) —
-- ese rol no tenía select en profiles, y RLS bloqueaba de todos modos por
-- no tener política para ese rol. GoTrue devolvía "Error running hook URI"
-- y login fallaba para todo el mundo. Corregido: security definer (corre
-- como postgres, dueño de la función, que bypassa RLS por ser dueño de la
-- tabla) + grant select explícito en profiles a supabase_auth_admin como
-- respaldo. Mismo patrón que auth_role()/auth_company_ids() (2.5/2.6).
-- Reversión: alter function custom_access_token_hook(jsonb) security invoker;
--            revoke select on public.profiles from supabase_auth_admin;

alter function custom_access_token_hook(jsonb) security definer set search_path = public;

grant select on public.profiles to supabase_auth_admin;
