-- Migración: banners_category_hero
-- Fase 5 de docs/tasks/ACTIVE-cierre-brechas-ux-hunter.md. Nuevo
-- placement 'category_hero' (validado en código, ALLOWED_BANNER_
-- PLACEMENTS de manage-banner.ts — el placement en sí es solo texto en
-- la columna existente, sin constraint de base). category_id nullable:
-- solo se usa cuando placement='category_hero', el resto de placements
-- lo dejan null. Sin cambio de RLS — banners_read_public/banners_
-- write_master ya cubren cualquier columna de la tabla.
-- Reversión: alter table banners drop column category_id;

alter table banners add column category_id uuid references categories(id);

create index on banners (category_id) where category_id is not null;
