-- Migración: promotions_rls_policies
-- Paso 3.3 (Fase 5, ACTIVE-fase-5-panel-maestro-A.md). Exacta a
-- 05-RLS-SECURITY-C.md — mismo patrón que banners.

create policy promotions_read_public on promotions
for select to anon, authenticated
using (
  is_active = true
  and (starts_at is null or starts_at <= now())
  and (ends_at is null or ends_at >= now())
);

create policy promotions_write_master on promotions
for all to authenticated
using (is_master())
with check (is_master());
