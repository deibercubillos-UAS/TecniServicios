-- Migración: banners_rls_policies
-- Paso 3.2 (Fase 5, ACTIVE-fase-5-panel-maestro-A.md). Exacta a
-- 05-RLS-SECURITY-C.md.

create policy banners_read_public on banners
for select to anon, authenticated
using (
  is_active = true
  and (starts_at is null or starts_at <= now())
  and (ends_at is null or ends_at >= now())
);

create policy banners_write_master on banners
for all to authenticated
using (is_master())
with check (is_master());
