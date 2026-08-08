-- Migración: create_carts_and_cart_items
-- Aplicada: 2026-08-08, vía mcp__Supabase__apply_migration sobre el
-- proyecto tecni (sieiprqcvubkmrmvwwik).
-- Paso 2.2 (Fase 3, ACTIVE-fase-3-comercio-A.md). Exacta a
-- 04-DATABASE-SCHEMA-B.md sección 5. RLS habilitada en ambas, sin
-- políticas todavía (se abren en la Fase 3 de la tarea).
-- Reversión: drop table cart_items, carts;

create table carts (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade,
  company_id uuid references companies(id) on delete cascade,
  session_id text,                       -- carrito anónimo previo al login
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table cart_items (
  id         uuid primary key default gen_random_uuid(),
  cart_id    uuid not null references carts(id) on delete cascade,
  product_id uuid not null references products(id),
  quantity   int not null check (quantity > 0),
  unit_price_cop numeric(14,2),          -- congelado al agregar
  created_at timestamptz not null default now(),
  unique (cart_id, product_id)
);

alter table carts enable row level security;
alter table cart_items enable row level security;
