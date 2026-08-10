-- Migración: create_maintenance_availability
-- El cliente pedía que la fecha preferida de mantenimiento esté limitada
-- por lo que master programe como disponible (docs/tasks/ACTIVE-
-- disponibilidad-mantenimiento.md). Capacidad a nivel de día, no de
-- técnico: `maintenance_requests.technician_id` se asigna después de la
-- solicitud (`confirmMaintenance`), no existe todavía en el momento en
-- que el cliente elige fecha.
-- Reversión: drop table maintenance_availability;

create table maintenance_availability (
  available_date date primary key,
  max_visits integer not null default 1 check (max_visits > 0),
  notes text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

alter table maintenance_availability enable row level security;

-- Cualquier autenticado necesita leer las fechas abiertas para poder
-- elegir una al agendar (customer, seller en nombre de cliente, master).
create policy maintenance_availability_read on maintenance_availability
for select to authenticated
using (true);

-- Solo master abre/cierra fechas.
create policy maintenance_availability_write_master on maintenance_availability
for all to authenticated
using (is_master())
with check (is_master());
