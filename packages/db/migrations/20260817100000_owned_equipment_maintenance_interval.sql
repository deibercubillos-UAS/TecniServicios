-- Migración: owned_equipment_maintenance_interval
-- Aplicada: 2026-08-16, vía mcp__Supabase__apply_migration sobre el
-- proyecto tecni (sieiprqcvubkmrmvwwik).
-- Permite a master fijar cada cuántos meses un equipo requiere
-- mantenimiento preventivo, y guarda la fecha calculada del próximo
-- vencimiento para que un cron diario pueda avisar por correo 15 días
-- antes (docs/tasks/done/DONE-mantenimiento-preventivo-recordatorio.md).
-- RLS: owned_equipment_write_master (fila, ya existente) cubre las
-- columnas nuevas sin cambios — sin política nueva.
-- Reversión:
--   alter table owned_equipment
--     drop column maintenance_interval_months,
--     drop column last_maintenance_completed_at,
--     drop column next_maintenance_due_at,
--     drop column maintenance_reminder_sent_for;

alter table owned_equipment
  add column maintenance_interval_months int,
  add column last_maintenance_completed_at date,
  add column next_maintenance_due_at date,
  add column maintenance_reminder_sent_for date;

-- null = sin intervalo configurado todavía, sin recordatorios — cero
-- regresión para los equipos existentes.

create index on owned_equipment (next_maintenance_due_at) where next_maintenance_due_at is not null;
