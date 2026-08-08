-- Migración: create_shipments
-- Aplicada: 2026-08-08, vía mcp__Supabase__apply_migration sobre el
-- proyecto tecni (sieiprqcvubkmrmvwwik).
-- Paso 2.6 (Fase 3, ACTIVE-fase-3-comercio-A.md). Exacta a
-- 04-DATABASE-SCHEMA-B.md sección 5. RLS habilitada, sin políticas
-- todavía. Guía cargada manualmente por el vendedor. Cierra el esquema
-- completo de la Fase 2 (esquema) de esta tarea.
-- Reversión: drop table shipments;

create table shipments (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references orders(id),
  carrier       text,
  tracking_number text,
  tracking_url  text,
  shipped_at    timestamptz,
  delivered_at  timestamptz,
  notes         text,
  created_by    uuid references profiles(id),
  created_at    timestamptz not null default now()
);

alter table shipments enable row level security;
