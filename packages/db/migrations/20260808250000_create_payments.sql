-- Migración: create_payments
-- Aplicada: 2026-08-08, vía mcp__Supabase__apply_migration sobre el
-- proyecto tecni (sieiprqcvubkmrmvwwik).
-- Paso 2.5 (Fase 3, ACTIVE-fase-3-comercio-A.md). Exacta a
-- 04-DATABASE-SCHEMA-B.md sección 5. RLS habilitada, sin políticas
-- todavía.
-- Reversión: drop table payments;

create table payments (
  id             uuid primary key default gen_random_uuid(),
  order_id       uuid not null references orders(id),
  provider       text not null default 'wompi',
  provider_ref   text,                    -- id de transacción Wompi
  status         payment_status not null default 'pending',
  amount_cop     numeric(14,2) not null,
  method         text,
  raw_response   jsonb,
  paid_at        timestamptz,
  created_at     timestamptz not null default now()
);

create unique index on payments (provider, provider_ref) where provider_ref is not null;

alter table payments enable row level security;
