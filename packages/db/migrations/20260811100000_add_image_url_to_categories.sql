-- Migración: add_image_url_to_categories
-- Agrega la foto full-bleed de categoría (CategoryHeroCard,
-- docs/03-UI-COMPONENTS.md sección 3 / docs/tasks/ACTIVE-mejoras-
-- frontend-hunter.md Fase 2). Nullable: no fabricamos una foto por
-- categoría, se llena cuando el master la sube desde /admin/categorias.
-- No hace falta política RLS nueva: categories_write_master
-- (20260808170000_categories_brands_rls_policies.sql) ya cubre `update`
-- de cualquier columna, y categories_read_public ya expone la fila
-- completa a anon/authenticated en categorías activas.
-- Reversión: alter table categories drop column image_url;

alter table categories add column image_url text;
