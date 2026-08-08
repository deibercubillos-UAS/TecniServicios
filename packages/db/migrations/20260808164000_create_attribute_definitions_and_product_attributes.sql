-- Migración: create_attribute_definitions_and_product_attributes
-- Aplicada: 2026-08-08, vía mcp__Supabase__apply_migration sobre el
-- proyecto tecni (sieiprqcvubkmrmvwwik).
-- Exacta a 04-DATABASE-SCHEMA-A.md sección 4. RLS habilitada en la
-- misma migración en ambas tablas, sin políticas todavía.
-- Reversión: drop table product_attributes, attribute_definitions;

create table attribute_definitions (
  id           uuid primary key default gen_random_uuid(),
  category_id  uuid not null references categories(id) on delete cascade,
  key          text not null,
  label        text not null,
  unit         text,
  data_type    text not null default 'text',
  options      jsonb,
  is_filterable boolean not null default false,
  is_comparable boolean not null default true,
  position     int not null default 0,
  unique (category_id, key)
);

create table product_attributes (
  product_id    uuid not null references products(id) on delete cascade,
  definition_id uuid not null references attribute_definitions(id) on delete cascade,
  value_text    text,
  value_number  numeric,
  value_boolean boolean,
  primary key (product_id, definition_id)
);

create index on product_attributes (definition_id, value_number);

alter table attribute_definitions enable row level security;
alter table product_attributes enable row level security;
