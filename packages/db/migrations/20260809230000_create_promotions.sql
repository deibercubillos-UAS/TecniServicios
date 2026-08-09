-- Migración: create_promotions
-- Paso 2.3 (Fase 5, ACTIVE-fase-5-panel-maestro-A.md). Exacta a
-- 04-DATABASE-SCHEMA-B.md sección 7. RLS habilitada, sin políticas
-- todavía (paso 3.3).
-- Reversión: drop table promotions;

create table promotions (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  description   text,
  discount_type text not null default 'percentage',
  discount_value numeric(10,2) not null,
  product_id    uuid references products(id),
  category_id   uuid references categories(id),
  starts_at     timestamptz,
  ends_at       timestamptz,
  is_active     boolean not null default true
);

alter table promotions enable row level security;
