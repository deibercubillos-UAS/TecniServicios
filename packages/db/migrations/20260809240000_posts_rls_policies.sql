-- Migración: posts_rls_policies
-- Paso 3.1 (Fase 5, ACTIVE-fase-5-panel-maestro-A.md). Exacta a
-- 05-RLS-SECURITY-C.md.

create policy posts_read_public on posts
for select to anon, authenticated
using (is_published = true and published_at <= now());

create policy posts_write_master on posts
for all to authenticated
using (is_master())
with check (is_master());
