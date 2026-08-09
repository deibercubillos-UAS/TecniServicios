-- Migración: company_members_write_master
-- Paso 6.2 de ACTIVE-fase-5-panel-maestro-A.md: /admin/usuarios cambia
-- `member_role` (owner/buyer/accounting/workshop) dentro de una empresa.
-- company_members solo tenía members_read (Fase 1) — a diferencia de
-- profiles.role, member_role no tiene una restricción de auto-escalación
-- que romper, así que basta una política de escritura directa para
-- master (mismo patrón que products_write_master, categories_write_master,
-- etc. de fases previas).
--
-- Reversión: drop policy company_members_write_master on company_members;

create policy company_members_write_master on company_members
for update to authenticated
using (is_master())
with check (is_master());
