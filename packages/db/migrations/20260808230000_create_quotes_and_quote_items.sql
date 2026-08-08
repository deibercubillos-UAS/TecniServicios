-- Migración: create_quotes_and_quote_items
-- Aplicada: 2026-08-08, vía mcp__Supabase__apply_migration sobre el
-- proyecto tecni (sieiprqcvubkmrmvwwik).
-- Paso 2.3 (Fase 3, ACTIVE-fase-3-comercio-A.md). Exacta a
-- 04-DATABASE-SCHEMA-B.md sección 5. RLS habilitada en ambas, sin
-- políticas todavía.
-- Reversión: drop table quote_items, quotes;

create table quotes (
  id             uuid primary key default gen_random_uuid(),
  company_id     uuid not null references companies(id),
  requested_by   uuid not null references profiles(id),
  seller_id      uuid references profiles(id),
  status         quote_status not null default 'requested',
  siigo_quote_id text,                   -- consecutivo REAL, generado por Siigo
  siigo_number   text,
  subtotal_cop   numeric(14,2),
  tax_cop        numeric(14,2),
  total_cop      numeric(14,2),
  valid_until    date,
  customer_note  text,
  seller_note    text,
  pdf_r2_key     text,
  accepted_at    timestamptz,
  rejected_at    timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index on quotes (company_id, status);
create index on quotes (seller_id, status);

create table quote_items (
  id         uuid primary key default gen_random_uuid(),
  quote_id   uuid not null references quotes(id) on delete cascade,
  product_id uuid references products(id),
  description text not null,
  quantity   int not null,
  unit_price_cop numeric(14,2) not null,
  tax_rate   numeric(5,2) not null default 19.00,
  total_cop  numeric(14,2) not null
);

alter table quotes enable row level security;
alter table quote_items enable row level security;
