-- Migración: create_brands
-- Aplicada: 2026-08-08, vía mcp__Supabase__apply_migration sobre el
-- proyecto tecni (sieiprqcvubkmrmvwwik).
-- Exacta a 04-DATABASE-SCHEMA-A.md sección 4. RLS habilitada en la
-- misma migración, sin políticas todavía.
-- Reversión: drop table brands;

create table brands (
  id        uuid primary key default gen_random_uuid(),
  slug      text not null unique,
  name      text not null,
  logo_url  text,
  is_active boolean not null default true
);

alter table brands enable row level security;
