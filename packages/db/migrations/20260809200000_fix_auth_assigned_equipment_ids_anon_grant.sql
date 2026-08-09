-- Migración: fix_auth_assigned_equipment_ids_anon_grant
-- Paso 3.6 (Fase 4, ACTIVE-fase-4-postventa-A.md). Hallazgo real de
-- get_advisors: auth_assigned_equipment_ids() (creada en el paso 3.2)
-- quedó ejecutable por `anon` (grant de PUBLIC sin revocar) —
-- auth_company_ids()/auth_role() sí lo tenían revocado desde la Fase 1.
-- Mismo criterio acá: solo authenticated la necesita.

revoke execute on function auth_assigned_equipment_ids() from public;
grant execute on function auth_assigned_equipment_ids() to authenticated;
