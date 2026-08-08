-- Migración: create_orders_and_order_items
-- Aplicada: 2026-08-08, vía mcp__Supabase__apply_migration sobre el
-- proyecto tecni (sieiprqcvubkmrmvwwik).
-- Paso 2.4 (Fase 3, ACTIVE-fase-3-comercio-A.md). Exacta a
-- 04-DATABASE-SCHEMA-B.md sección 5. RLS habilitada en ambas, sin
-- políticas todavía.
-- Reversión: drop table order_items, orders;

create table orders (
  id            uuid primary key default gen_random_uuid(),
  order_number  text not null unique,     -- consecutivo propio de la web
  company_id    uuid not null references companies(id),
  placed_by     uuid not null references profiles(id),
  seller_id     uuid references profiles(id),
  quote_id      uuid references quotes(id),
  status        order_status not null default 'pending_payment',
  subtotal_cop  numeric(14,2) not null,
  tax_cop       numeric(14,2) not null,
  shipping_cop  numeric(14,2) not null default 0,
  total_cop     numeric(14,2) not null,
  shipping_address jsonb,
  siigo_invoice_id text,
  invoice_pdf_r2_key text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index on orders (company_id, status);

create table order_items (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id),
  description text not null,
  quantity   int not null,
  unit_price_cop numeric(14,2) not null,
  tax_rate   numeric(5,2) not null default 19.00,
  total_cop  numeric(14,2) not null
);

alter table orders enable row level security;
alter table order_items enable row level security;
