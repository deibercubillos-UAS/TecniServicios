-- Migración: settings_rls_policy
-- Paso 3.4 (Fase 5, ACTIVE-fase-5-panel-maestro-A.md). Exacta a
-- 05-RLS-SECURITY-C.md. Primera política real de `settings` desde que
-- quedó bloqueada por completo en la Fase 1. El resto del proyecto que
-- necesita quote_threshold_cop (carrito, checkout) sigue leyendo vía
-- service_role — esto es solo para que /admin/configuracion funcione
-- con la sesión real de master.

create policy settings_master on settings
for all to authenticated
using (is_master())
with check (is_master());
