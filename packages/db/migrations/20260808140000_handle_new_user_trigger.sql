-- Migración: handle_new_user_trigger
-- Aplicada: 2026-08-08, vía mcp__Supabase__apply_migration sobre el
-- proyecto tecni (sieiprqcvubkmrmvwwik).
-- Al insertar en auth.users crea la fila correspondiente en profiles.
-- full_name viene de raw_user_meta_data->>'full_name' (lo que pase
-- signUp() en options.data, Fase 8); si no llega, usa la parte local
-- del correo como fallback para no violar el not null de profiles.full_name.
-- role siempre 'customer' — el cambio a otro rol lo hace un master,
-- nunca este trigger (ver 04-DATABASE-SCHEMA-A.md sección 3).
-- Reversión: drop trigger on_auth_user_created on auth.users;
--            drop function handle_new_user();

create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'customer'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
