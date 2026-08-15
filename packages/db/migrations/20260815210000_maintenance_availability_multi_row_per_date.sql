-- El master ahora puede abrir varios técnicos/ciudades para la misma
-- fecha (generación masiva) — `available_date` deja de ser suficiente
-- como llave primaria. Se agrega `id` como llave real; se mantiene
-- unicidad por (fecha, técnico) solo cuando hay técnico asignado (varias
-- filas sin técnico para la misma fecha no rompen nada, son un caso raro).
alter table maintenance_availability drop constraint maintenance_availability_pkey;
alter table maintenance_availability add column id uuid not null default gen_random_uuid();
alter table maintenance_availability add primary key (id);
create unique index maintenance_availability_date_technician_uidx
  on maintenance_availability (available_date, technician_id)
  where technician_id is not null;
