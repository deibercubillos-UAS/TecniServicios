-- Migración: create_settings
-- Aplicada: 2026-08-08, vía mcp__Supabase__apply_migration sobre el
-- proyecto tecni (sieiprqcvubkmrmvwwik).
-- Decisión de la Fase 1 (docs/progress/DECISIONS.md): settings queda SIN
-- ninguna política RLS, bloqueada incluso para master. Solo service_role
-- la lee/escribe, siempre desde packages/core. Se agrega política de
-- lectura para master en la Fase 5, cuando exista el panel para editarla.
-- Reversión: drop table settings;

create table settings (
  key         text primary key,
  value       jsonb not null,
  description text,
  updated_by  uuid references profiles(id),
  updated_at  timestamptz not null default now()
);

alter table settings enable row level security;

insert into settings (key, value, description) values
  ('quote_threshold_cop', '5000000', 'Umbral para forzar cotización asistida');
