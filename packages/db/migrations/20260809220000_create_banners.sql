-- Migración: create_banners
-- Paso 2.2 (Fase 5, ACTIVE-fase-5-panel-maestro-A.md). Exacta a
-- 04-DATABASE-SCHEMA-B.md sección 7. RLS habilitada, sin políticas
-- todavía (paso 3.2).
-- Reversión: drop table banners;

create table banners (
  id         uuid primary key default gen_random_uuid(),
  title      text,
  image_url  text not null,
  mobile_image_url text,
  link_url   text,
  position   int not null default 0,
  placement  text not null default 'home_hero',
  starts_at  timestamptz,
  ends_at    timestamptz,
  is_active  boolean not null default true
);

alter table banners enable row level security;
