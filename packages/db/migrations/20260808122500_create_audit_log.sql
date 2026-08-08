-- Migración: create_audit_log
-- Aplicada: 2026-08-08, vía mcp__Supabase__apply_migration sobre el
-- proyecto tecni (sieiprqcvubkmrmvwwik).
-- Política audit_read_master llega en la Fase 3. Sin política de
-- insert/update/delete: inmutable, solo service_role escribe.
-- Reversión: drop table audit_log;

create table audit_log (
  id          bigserial primary key,
  actor_id    uuid references profiles(id),
  action      text not null,
  entity      text not null,
  entity_id   text,
  before      jsonb,
  after       jsonb,
  ip          inet,
  created_at  timestamptz not null default now()
);

create index on audit_log (entity, entity_id);
create index on audit_log (actor_id, created_at desc);

alter table audit_log enable row level security;
