-- Migración: create_owned_equipment
-- Paso 2.2 (Fase 4, ACTIVE-fase-4-postventa-A.md). Exacta a
-- 04-DATABASE-SCHEMA-B.md sección 6. RLS habilitada, sin políticas
-- todavía (paso 3.1).
-- Reversión: drop table owned_equipment;

create table owned_equipment (
  id            uuid primary key default gen_random_uuid(),
  company_id    uuid not null references companies(id),
  product_id    uuid not null references products(id),
  order_id      uuid references orders(id),
  serial_number text,
  delivered_at  date,
  warranty_until date,
  location_note text,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);

create index on owned_equipment (company_id);

alter table owned_equipment enable row level security;
