-- Migración: seed_attribute_definitions_desmontadoras
-- Aplicada: 2026-08-16, vía mcp__Supabase__apply_migration sobre el
-- proyecto tecni (sieiprqcvubkmrmvwwik).
-- Especificaciones verificadas contra ficha técnica real (TECNIMAX-302,
-- catálogo propio de TECNI EQUIPOS Y SERVICIOS SAS) — no inventadas.
-- Mismo patrón que 20260810120000_add_common_attribute_definitions.sql:
-- rangos y medidas duales quedan como texto libre (no number), igual
-- que diametro_rueda ya existente en Alineación y Balanceo.
-- Reversión: delete from attribute_definitions where category_id in
--   (select id from categories where slug = 'desmontadoras');

insert into attribute_definitions (category_id, key, label, unit, data_type, options, is_filterable, is_comparable, position)
select id, 'sujecion_externa', 'Sujeción externa', null, 'text', null, false, true, 1
from categories where slug = 'desmontadoras';
insert into attribute_definitions (category_id, key, label, unit, data_type, options, is_filterable, is_comparable, position)
select id, 'sujecion_interna', 'Sujeción interna', null, 'text', null, false, true, 2
from categories where slug = 'desmontadoras';
insert into attribute_definitions (category_id, key, label, unit, data_type, options, is_filterable, is_comparable, position)
select id, 'diametro_maximo', 'Diámetro máximo', null, 'text', null, false, true, 3
from categories where slug = 'desmontadoras';
insert into attribute_definitions (category_id, key, label, unit, data_type, options, is_filterable, is_comparable, position)
select id, 'ancho_maximo', 'Ancho máximo', null, 'text', null, false, true, 4
from categories where slug = 'desmontadoras';
insert into attribute_definitions (category_id, key, label, unit, data_type, options, is_filterable, is_comparable, position)
select id, 'nivel_ruido', 'Nivel de ruido', null, 'text', null, false, false, 5
from categories where slug = 'desmontadoras';
insert into attribute_definitions (category_id, key, label, unit, data_type, options, is_filterable, is_comparable, position)
select id, 'presion_trabajo', 'Presión de trabajo', null, 'text', null, false, true, 6
from categories where slug = 'desmontadoras';
insert into attribute_definitions (category_id, key, label, unit, data_type, options, is_filterable, is_comparable, position)
select id, 'potencia_motor', 'Potencia del motor', null, 'text', null, false, true, 7
from categories where slug = 'desmontadoras';
insert into attribute_definitions (category_id, key, label, unit, data_type, options, is_filterable, is_comparable, position)
select id, 'peso', 'Peso', null, 'text', null, false, true, 8
from categories where slug = 'desmontadoras';
insert into attribute_definitions (category_id, key, label, unit, data_type, options, is_filterable, is_comparable, position)
select id, 'alimentacion', 'Alimentación (opcional)', null, 'text', null, false, false, 9
from categories where slug = 'desmontadoras';
insert into attribute_definitions (category_id, key, label, unit, data_type, options, is_filterable, is_comparable, position)
select id, 'brazo_oscilante', 'Brazo oscilante', null, 'boolean', null, false, false, 10
from categories where slug = 'desmontadoras';
insert into attribute_definitions (category_id, key, label, unit, data_type, options, is_filterable, is_comparable, position)
select id, 'inflado_talon', 'Inflado de talón (opcional)', null, 'boolean', null, false, false, 11
from categories where slug = 'desmontadoras';
