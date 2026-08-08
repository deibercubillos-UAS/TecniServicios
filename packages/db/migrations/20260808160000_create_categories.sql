-- Migración: create_categories
-- Aplicada: 2026-08-08, vía mcp__Supabase__apply_migration sobre el
-- proyecto tecni (sieiprqcvubkmrmvwwik).
-- Exacta a 04-DATABASE-SCHEMA-A.md sección 4. RLS habilitada en la
-- misma migración, sin políticas todavía (se abre en la Fase 3 de
-- ACTIVE-fase-2-catalogo-publico.md).
-- Reversión: drop table categories;

create table categories (
  id          uuid primary key default gen_random_uuid(),
  parent_id   uuid references categories(id) on delete set null,
  slug        text not null unique,
  name        text not null,
  description text,
  icon_url    text,
  position    int not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

alter table categories enable row level security;
