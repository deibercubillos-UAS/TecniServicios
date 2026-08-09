-- Migración: change_user_role_function
-- Paso 6.2 de ACTIVE-fase-5-panel-maestro-A.md: /admin/usuarios necesita
-- cambiar el rol de un usuario. profiles_update_self (Fase 1,
-- 05-RLS-SECURITY-A.md) fuerza `role = auth_role()` en su propio check —
-- un usuario no puede auto-promoverse, y por eso ninguna política de
-- update abierta a master alcanza: la comprobación es sobre `auth.uid()`,
-- no sobre quién ejecuta. La misma sección ya documenta la solución:
-- "El cambio de rol solo ocurre por función security definer invocada
-- por un master, y queda en audit_log." — la función bypasea RLS
-- internamente (igual que auth_company_ids()/is_master()), valida
-- is_master() a mano, y el audit_log lo escribe la capa de aplicación
-- (packages/core, mismo patrón que el resto del proyecto) tras el RPC.
--
-- Reversión: drop function change_user_role(uuid, user_role);

create or replace function change_user_role(p_user_id uuid, p_new_role user_role) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_master() then
    raise exception 'insufficient_privilege' using errcode = '42501';
  end if;
  update profiles set role = p_new_role, updated_at = now() where id = p_user_id;
end;
$$;

revoke execute on function change_user_role(uuid, user_role) from public, anon;
grant execute on function change_user_role(uuid, user_role) to authenticated;
