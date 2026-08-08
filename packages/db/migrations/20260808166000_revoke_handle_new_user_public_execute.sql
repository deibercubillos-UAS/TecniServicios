-- Migración: revoke_handle_new_user_public_execute
-- Aplicada: 2026-08-08, vía mcp__Supabase__apply_migration sobre el
-- proyecto tecni (sieiprqcvubkmrmvwwik).
-- Corrige un hallazgo de get_advisors (paso 2.7 de
-- ACTIVE-fase-2-catalogo-publico.md, no detectado cuando se creó la
-- función en la Fase 1 paso 6.1 — esa fase no tuvo un get_advisors
-- posterior a ese paso): handle_new_user() quedó ejecutable vía RPC
-- público (/rest/v1/rpc/handle_new_user) por anon y authenticated. Es
-- un trigger, no está pensada para invocarse directo. Revocado sin
-- afectar el disparador: el trigger la ejecuta como security definer,
-- no depende de que el rol de la sesión tenga permiso de execute.
-- Verificado con una inserción de prueba real en auth.users después
-- de revocar — el trigger siguió funcionando.
-- Reversión: grant execute on function handle_new_user() to public, anon, authenticated;

revoke execute on function handle_new_user() from public, anon, authenticated;
