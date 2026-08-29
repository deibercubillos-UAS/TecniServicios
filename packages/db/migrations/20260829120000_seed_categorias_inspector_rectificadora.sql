-- Migración: seed_categorias_inspector_rectificadora
-- Aplicada: 2026-08-29, vía mcp__Supabase__apply_migration sobre el
-- proyecto tecni (sieiprqcvubkmrmvwwik).
-- El usuario compartió fichas técnicas reales (WhatsApp) de 8 equipos
-- TECNI para cargar al catálogo. 4 son Balanceadoras (categoría ya
-- existente, mismas 12 specs). Los otros 4 son de dos tipos que no
-- tenían categoría: "Inspector de llantas" (soporte para reparación/
-- inspección de neumáticos) y "Rectificadora de rines" (prensa para
-- enderezar rines de aluminio/magnesio). Mismo patrón que
-- 20260828140000_seed_category_balanceadoras.sql.
-- Reversión:
--   delete from categories where slug in ('inspector-llantas', 'rectificadora-rines');
--   (elimina también sus attribute_definitions vía on delete cascade)

insert into categories (slug, name, description, position)
values (
  'inspector-llantas',
  'Inspector de Llantas',
  'Soportes para fijación, inspección y reparación de neumáticos de automóviles.',
  9
);

insert into attribute_definitions (category_id, key, label, unit, data_type, options, is_filterable, is_comparable, position)
select id, 'modelo', 'Modelo', null, 'text', null, false, false, 1
from categories where slug = 'inspector-llantas';
insert into attribute_definitions (category_id, key, label, unit, data_type, options, is_filterable, is_comparable, position)
select id, 'voltaje', 'Voltaje', null, 'text', null, false, false, 2
from categories where slug = 'inspector-llantas';
insert into attribute_definitions (category_id, key, label, unit, data_type, options, is_filterable, is_comparable, position)
select id, 'precision_aire', 'Precisión de aire', null, 'text', null, false, true, 3
from categories where slug = 'inspector-llantas';
insert into attribute_definitions (category_id, key, label, unit, data_type, options, is_filterable, is_comparable, position)
select id, 'diametro_rin', 'Diámetro del rin', null, 'text', null, false, true, 4
from categories where slug = 'inspector-llantas';
insert into attribute_definitions (category_id, key, label, unit, data_type, options, is_filterable, is_comparable, position)
select id, 'ancho_rin', 'Ancho del rin', null, 'text', null, false, true, 5
from categories where slug = 'inspector-llantas';
insert into attribute_definitions (category_id, key, label, unit, data_type, options, is_filterable, is_comparable, position)
select id, 'peso_neto', 'Peso neto', null, 'text', null, false, true, 6
from categories where slug = 'inspector-llantas';

insert into categories (slug, name, description, position)
values (
  'rectificadora-rines',
  'Rectificadora de Rines',
  'Prensas para rectificar rines de aluminio y magnesio.',
  10
);

insert into attribute_definitions (category_id, key, label, unit, data_type, options, is_filterable, is_comparable, position)
select id, 'cono_matriz', 'Cono matriz', null, 'text', null, false, true, 1
from categories where slug = 'rectificadora-rines';
insert into attribute_definitions (category_id, key, label, unit, data_type, options, is_filterable, is_comparable, position)
select id, 'dimension', 'Dimensión (an×al)', null, 'text', null, false, false, 2
from categories where slug = 'rectificadora-rines';
insert into attribute_definitions (category_id, key, label, unit, data_type, options, is_filterable, is_comparable, position)
select id, 'motor', 'Motor', null, 'text', null, false, true, 3
from categories where slug = 'rectificadora-rines';
insert into attribute_definitions (category_id, key, label, unit, data_type, options, is_filterable, is_comparable, position)
select id, 'sitios_trabajo', 'Sitios de trabajo', null, 'number', null, false, true, 4
from categories where slug = 'rectificadora-rines';
insert into attribute_definitions (category_id, key, label, unit, data_type, options, is_filterable, is_comparable, position)
select id, 'estructura', 'Estructura', null, 'text', null, false, false, 5
from categories where slug = 'rectificadora-rines';
