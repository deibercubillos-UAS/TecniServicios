-- Migración: create_companies_and_members
-- Aplicada: 2026-08-08, vía mcp__Supabase__apply_migration sobre el
-- proyecto tecni (sieiprqcvubkmrmvwwik).
-- Reversión: drop table company_members, companies cascade;
--             drop type company_member_role;

create type company_member_role as enum ('owner','buyer','accounting','workshop');

create table companies (
  id              uuid primary key default gen_random_uuid(),
  legal_name      text not null,
  trade_name      text,
  document_type   text not null default 'NIT',
  document_number text not null,
  verification_digit text,
  address         text,
  city            text,
  department      text,
  phone           text,
  email           text,
  siigo_customer_id text,
  is_verified     boolean not null default false,
  assigned_seller_id uuid references profiles(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (document_type, document_number)
);

create table company_members (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references companies(id) on delete cascade,
  profile_id  uuid not null references profiles(id) on delete cascade,
  member_role company_member_role not null default 'buyer',
  is_primary  boolean not null default false,
  created_at  timestamptz not null default now(),
  unique (company_id, profile_id)
);

create index on company_members (profile_id);
create index on companies (assigned_seller_id);

alter table companies enable row level security;
alter table company_members enable row level security;
