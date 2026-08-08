-- Migración: profiles_rls_policies
-- Aplicada: 2026-08-08, vía mcp__Supabase__apply_migration sobre el
-- proyecto tecni (sieiprqcvubkmrmvwwik).
-- Exacta a docs/05-RLS-SECURITY.md sección 4. profiles_update_self impide
-- auto-promoción de rol vía el check "role = auth_role()".
-- Reversión: drop policy profiles_self, profiles_update_self on profiles;

create policy profiles_self on profiles
for select to authenticated using (id = auth.uid() or is_master());

create policy profiles_update_self on profiles
for update to authenticated
using (id = auth.uid()) with check (id = auth.uid() and role = auth_role());
