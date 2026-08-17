-- Migración: seed_category_desmontadoras
-- Aplicada: 2026-08-16, vía mcp__Supabase__apply_migration sobre el
-- proyecto tecni (sieiprqcvubkmrmvwwik).
-- Nueva categoría de catálogo, sin la cual no hay dónde clasificar
-- desmontadoras de llantas (docs/tasks/done/DONE-categoria-
-- desmontadoras.md). Sigue el mismo patrón de las 6 categorías
-- existentes (creadas fuera de migración trackeada — brecha histórica
-- documentada, no repetida acá).
-- Reversión: delete from categories where slug = 'desmontadoras';

insert into categories (slug, name, description, position)
values (
  'desmontadoras',
  'Desmontadoras',
  'Desmontadoras de llantas para turismos, vehículos ligeros, motocicletas y scooters.',
  7
);
