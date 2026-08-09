-- Migración: create_posts
-- Paso 2.1 (Fase 5, ACTIVE-fase-5-panel-maestro-A.md). Exacta a
-- 04-DATABASE-SCHEMA-B.md sección 7. RLS habilitada, sin políticas
-- todavía (paso 3.1).
-- Reversión: drop table posts;

create table posts (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  title        text not null,
  excerpt      text,
  body         text,
  cover_url    text,
  author_id    uuid references profiles(id),
  is_published boolean not null default false,
  published_at timestamptz,
  seo_title    text,
  seo_description text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table posts enable row level security;
