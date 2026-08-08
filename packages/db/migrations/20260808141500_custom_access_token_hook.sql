-- Migración: custom_access_token_hook
-- Aplicada: 2026-08-08, vía mcp__Supabase__apply_migration sobre el
-- proyecto tecni (sieiprqcvubkmrmvwwik).
-- Agrega el claim `user_role` al JWT desde profiles.role, para que el
-- middleware (Fase 9) lea el rol sin consultar la base de datos
-- (06-AUTH-ROLES.md sección 5). Patrón estándar de Supabase Auth Hooks
-- (Custom Access Token). Solo supabase_auth_admin puede ejecutarla —
-- revocado explícitamente para authenticated/anon/public.
-- Requiere el paso manual 7.2: habilitar el hook en Supabase Dashboard
-- → Authentication → Hooks → Custom Access Token (sin herramienta MCP
-- para esto).
-- Reversión: drop function custom_access_token_hook(jsonb);

create or replace function custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
as $$
declare
  claims jsonb;
  user_role_value text;
begin
  select role::text into user_role_value from profiles where id = (event->>'user_id')::uuid;

  claims := event->'claims';

  if user_role_value is not null then
    claims := jsonb_set(claims, '{user_role}', to_jsonb(user_role_value));
  else
    claims := jsonb_set(claims, '{user_role}', 'null');
  end if;

  event := jsonb_set(event, '{claims}', claims);

  return event;
end;
$$;

grant usage on schema public to supabase_auth_admin;
grant execute on function public.custom_access_token_hook to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook from authenticated, anon, public;
