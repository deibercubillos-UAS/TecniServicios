-- Migración: profiles_data_consent
-- Aplicada: 2026-08-08, vía mcp__Supabase__apply_migration sobre el
-- proyecto tecni (sieiprqcvubkmrmvwwik).
-- 05-RLS-SECURITY.md sección 8 exige guardar fecha, IP y versión de la
-- política junto a la casilla de autorización de tratamiento de datos
-- del registro (Ley 1581 de 2012). No existía columna para esto en
-- 04-DATABASE-SCHEMA-A.md — se agrega aquí, al construir /registro
-- (paso 8.1 de la Fase 1), y se documenta la desviación en
-- progress/DECISIONS.md. Nulos hasta que el usuario complete el
-- registro (la Server Action los llena en la misma transacción lógica
-- que crea el perfil).
-- Reversión: alter table profiles drop column consent_accepted_at,
--            drop column consent_ip, drop column consent_policy_version;

alter table profiles
  add column consent_accepted_at timestamptz,
  add column consent_ip inet,
  add column consent_policy_version text;
