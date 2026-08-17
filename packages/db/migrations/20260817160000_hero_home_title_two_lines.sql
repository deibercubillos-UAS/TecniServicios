-- Migración: hero_home_title_two_lines
-- Aplicada: 2026-08-17, vía mcp__Supabase__apply_migration sobre el
-- proyecto tecni (sieiprqcvubkmrmvwwik).
-- El usuario pidió que el título del hero vuelva a tener dos líneas
-- (blanca / roja), como el original hardcodeado, pero ahora editable
-- — `home_hero_title` (una sola línea, sembrada en 20260817150000) se
-- reemplaza por dos claves (docs/tasks/done/DONE-hero-home-mejoras.md).
-- Reversión:
--   insert into settings (key, value, description) values
--     ('home_hero_title', '"Soluciones que construyen confianza"', 'Título del hero');
--   delete from settings where key in ('home_hero_title_line1', 'home_hero_title_line2');

delete from settings where key = 'home_hero_title';

insert into settings (key, value, description) values
  ('home_hero_title_line1', '"Soluciones que"', 'Primera línea del título del hero del home (color blanco)'),
  ('home_hero_title_line2', '"construyen confianza"', 'Segunda línea del título del hero del home (color rojo, marca)');
