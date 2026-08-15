-- Metadatos informativos por fecha abierta: qué técnico la cubre y en qué
-- ciudad — el cupo (`max_visits`) sigue siendo compartido a nivel de día,
-- no se parte por técnico (una fecha = una fila, como hoy).
alter table maintenance_availability add column technician_id uuid references profiles(id);
alter table maintenance_availability add column city text;
