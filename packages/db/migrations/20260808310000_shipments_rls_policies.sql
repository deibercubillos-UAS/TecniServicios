-- Migración: shipments_rls_policies
-- Aplicada: 2026-08-08, vía mcp__Supabase__apply_migration sobre el
-- proyecto tecni (sieiprqcvubkmrmvwwik).
-- Paso 3.5 (Fase 3, ACTIVE-fase-3-comercio-A.md). Exacta a
-- 05-RLS-SECURITY-A.md, sección "Comercio". Envío manual — solo
-- vendedor/master cargan la guía. Cierra las 8 tablas de comercio con
-- políticas RLS reales.

create policy shipments_read on shipments
for select to authenticated
using (
  order_id in (select id from orders where company_id in (select auth_company_ids()))
  or is_master()
);

create policy shipments_write_staff on shipments
for all to authenticated
using (auth_role() in ('seller','master'))
with check (auth_role() in ('seller','master'));
