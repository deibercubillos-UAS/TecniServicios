-- Migración: create_support_tickets
-- Paso 2.4 (Fase 4, ACTIVE-fase-4-postventa-A.md). Exacta a
-- 04-DATABASE-SCHEMA-B.md sección 6. RLS habilitada, sin políticas
-- todavía (paso 3.4/3.5). ticket_messages.is_internal requiere
-- atención especial en RLS: una nota interna nunca llega al cliente.
-- Reversión: drop table ticket_messages, support_tickets;

create table support_tickets (
  id            uuid primary key default gen_random_uuid(),
  ticket_number text not null unique,
  company_id    uuid not null references companies(id),
  equipment_id  uuid references owned_equipment(id),
  opened_by     uuid not null references profiles(id),
  assigned_to   uuid references profiles(id),
  status        ticket_status not null default 'open',
  priority      ticket_priority not null default 'medium',
  subject       text not null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  resolved_at   timestamptz
);

create table ticket_messages (
  id         uuid primary key default gen_random_uuid(),
  ticket_id  uuid not null references support_tickets(id) on delete cascade,
  author_id  uuid not null references profiles(id),
  body       text not null,
  is_internal boolean not null default false,
  attachments jsonb,
  created_at timestamptz not null default now()
);

alter table support_tickets enable row level security;
alter table ticket_messages enable row level security;
