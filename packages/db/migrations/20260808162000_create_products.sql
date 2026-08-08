-- Migración: create_products
-- Aplicada: 2026-08-08, vía mcp__Supabase__apply_migration sobre el
-- proyecto tecni (sieiprqcvubkmrmvwwik).
-- Exacta a 04-DATABASE-SCHEMA-A.md sección 4. RLS habilitada en la
-- misma migración, sin políticas todavía. `public_products` es la
-- vista sin precio de 05-RLS-SECURITY.md sección 3 — no tiene RLS
-- propia, la usan las políticas de anon como bypass controlado
-- (propiedad de postgres). Grant de select a anon llega en la Fase 3.
-- Reversión: drop view public_products; drop table products;
--            drop type product_type;

create type product_type as enum ('equipment','part','supply');

create table products (
  id            uuid primary key default gen_random_uuid(),
  sku           text not null unique,
  siigo_product_id text,
  slug          text not null unique,
  name          text not null,
  short_description text,
  description   text,
  type          product_type not null default 'equipment',
  category_id   uuid not null references categories(id),
  brand_id      uuid references brands(id),
  is_serialized boolean not null default false,
  warranty_months int,
  is_active     boolean not null default true,
  is_featured   boolean not null default false,
  price_cop     numeric(14,2),
  tax_rate      numeric(5,2) not null default 19.00,
  price_source  text not null default 'siigo',
  price_synced_at timestamptz,
  price_is_stale boolean not null default true,
  stock_status  text not null default 'unknown',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz
);

create index on products (category_id) where deleted_at is null;
create index on products (brand_id);
create index on products (is_active, is_featured);
create index on products using gin (to_tsvector('spanish', name || ' ' || coalesce(short_description,'')));

alter table products enable row level security;

create view public_products as
select id, sku, slug, name, short_description, description, type,
       category_id, brand_id, is_active, is_featured, stock_status
from products
where is_active = true and deleted_at is null;
