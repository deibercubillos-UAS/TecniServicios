-- Migración: audit_log_rls_policy
-- Aplicada: 2026-08-08, vía mcp__Supabase__apply_migration sobre el
-- proyecto tecni (sieiprqcvubkmrmvwwik).
-- Exacta a docs/05-RLS-SECURITY.md sección 4. Sin política de insert:
-- solo service_role escribe desde el servidor. Sin política de update ni
-- delete: el log es inmutable, ni siquiera master puede alterarlo.
-- Reversión: drop policy audit_read_master on audit_log;

create policy audit_read_master on audit_log for select to authenticated using (is_master());
