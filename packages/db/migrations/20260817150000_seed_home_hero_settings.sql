-- Migración: seed_home_hero_settings
-- Aplicada: 2026-08-17, vía mcp__Supabase__apply_migration sobre el
-- proyecto tecni (sieiprqcvubkmrmvwwik).
-- El panel de texto fijo del hero del home (título, descripción, 2
-- botones opcionales) vivía hardcodeado en hero-carousel.tsx, sin
-- relación con ninguna tabla — el master no podía editarlo. Se reusa
-- el sistema genérico de `settings` (/admin/configuracion), mismo
-- patrón que 20260809340000_seed_contact_settings.sql. Sembrado con el
-- copy actual → cero regresión visual al desplegar
-- (docs/tasks/done/DONE-hero-home-editable.md).
-- Reversión: delete from settings where key like 'home\_hero\_%' escape '\';
--            drop policy settings_read_home_hero_public on settings;

insert into settings (key, value, description) values
  ('home_hero_title', '"Soluciones que construyen confianza"', 'Título del panel de texto del hero del home'),
  ('home_hero_description', '"Maquinaria, herramientas, repuestos y consumibles para el sector automotriz en Colombia — alineación, balanceo, elevación, diagnóstico y lubricación."', 'Descripción del panel de texto del hero del home'),
  ('home_hero_button1_enabled', 'true', 'Muestra u oculta el botón 1 del hero del home'),
  ('home_hero_button1_label', '"Ver catálogo completo"', 'Texto del botón 1 del hero del home'),
  ('home_hero_button1_link', '"/catalogo"', 'Enlace del botón 1 del hero del home'),
  ('home_hero_button2_enabled', 'true', 'Muestra u oculta el botón 2 del hero del home'),
  ('home_hero_button2_label', '"Solicitar asesoría"', 'Texto del botón 2 del hero del home'),
  ('home_hero_button2_link', '"/contacto"', 'Enlace del botón 2 del hero del home');

create policy settings_read_home_hero_public on settings
for select to anon, authenticated
using (key like 'home\_hero\_%' escape '\');
