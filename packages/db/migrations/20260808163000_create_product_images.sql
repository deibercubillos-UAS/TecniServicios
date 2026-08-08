-- Migración: create_product_images
-- Aplicada: 2026-08-08, vía mcp__Supabase__apply_migration sobre el
-- proyecto tecni (sieiprqcvubkmrmvwwik).
-- Exacta a 04-DATABASE-SCHEMA-A.md sección 4. RLS habilitada en la
-- misma migración, sin políticas todavía.
-- Reversión: drop table product_images;

create table product_images (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  url        text not null,
  alt        text,
  position   int not null default 0,
  is_primary boolean not null default false
);

alter table product_images enable row level security;
