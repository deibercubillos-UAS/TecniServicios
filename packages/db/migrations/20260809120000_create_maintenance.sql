-- Migración: create_maintenance
-- Paso 2.3 (Fase 4, ACTIVE-fase-4-postventa-A.md). Exacta a
-- 04-DATABASE-SCHEMA-B.md sección 6. RLS habilitada, sin políticas
-- todavía (paso 3.2/3.3).
-- Reversión: drop table maintenance_reports, maintenance_requests;

create table maintenance_requests (
  id            uuid primary key default gen_random_uuid(),
  company_id    uuid not null references companies(id),
  equipment_id  uuid not null references owned_equipment(id),
  requested_by  uuid not null references profiles(id),
  technician_id uuid references profiles(id),
  status        maintenance_status not null default 'requested',
  preferred_date date,
  confirmed_at  timestamptz,
  scheduled_at  timestamptz,
  completed_at  timestamptz,
  description   text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index on maintenance_requests (technician_id, status);
create index on maintenance_requests (company_id, status);

create table maintenance_reports (
  id            uuid primary key default gen_random_uuid(),
  request_id    uuid not null references maintenance_requests(id) on delete cascade,
  technician_id uuid not null references profiles(id),
  work_done     text not null,
  parts_used    jsonb,
  recommendations text,
  next_service_date date,
  attachments   jsonb,
  customer_signature_r2_key text,
  created_at    timestamptz not null default now()
);

alter table maintenance_requests enable row level security;
alter table maintenance_reports enable row level security;
