-- Migración: hero_home_badge_label
-- Aplicada: 2026-08-17, vía mcp__Supabase__apply_migration sobre el
-- proyecto tecni (sieiprqcvubkmrmvwwik).
-- Última pieza del panel de texto fijo del hero sin editar: el badge
-- superior ("Equipamiento industrial para talleres") seguía
-- hardcodeado en hero-carousel.tsx (docs/tasks/done/DONE-hero-home-
-- mejoras.md). Mismo patrón que home_hero_title_line1/2 — sembrado con
-- el texto actual, cero regresión.
-- Reversión: delete from settings where key = 'home_hero_badge_label';

insert into settings (key, value, description) values
  ('home_hero_badge_label', '"Equipamiento industrial para talleres"', 'Texto del badge superior del hero del home');
