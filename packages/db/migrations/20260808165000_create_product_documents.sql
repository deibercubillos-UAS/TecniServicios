-- Migración: create_product_documents
-- Aplicada: 2026-08-08, vía mcp__Supabase__apply_migration sobre el
-- proyecto tecni (sieiprqcvubkmrmvwwik).
-- Exacta a 04-DATABASE-SCHEMA-A.md sección 4. RLS habilitada en la
-- misma migración, sin políticas — y sin políticas hasta el módulo de
-- postventa (owned_equipment no existe todavía). Ver la nota en
-- 05-RLS-SECURITY.md, sección "product_documents — manuales".
-- Reversión: drop table product_documents;

create table product_documents (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  title      text not null,
  kind       text not null default 'manual',
  r2_key     text not null,
  file_size  bigint,
  is_public  boolean not null default false,
  created_at timestamptz not null default now()
);

alter table product_documents enable row level security;
