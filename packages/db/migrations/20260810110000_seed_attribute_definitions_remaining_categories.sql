-- Migración: seed_attribute_definitions_remaining_categories
-- Continúa el patrón de 20260809320000_seed_attribute_definitions_elevacion_
-- alineacion.sql (Elevación, Alineación y Balanceo) para las 4 categorías que
-- quedaban sin definiciones — la ficha técnica ya no se sube como archivo
-- (docs/tasks siguiente), se llena campo por campo desde
-- /admin/productos/[id], por categoría. Características genéricas y
-- defendibles para equipos/herramientas/insumos automotrices, no
-- specs de un modelo real inventado.
-- Reversión: delete from attribute_definitions where category_id in (
--   select id from categories where name in
--   ('Diagnóstico','Herramientas de Taller','Insumos y Consumibles','Lubricación'));

insert into attribute_definitions (category_id, key, label, unit, data_type, options, is_filterable, is_comparable, position)
select id, 'voltaje', 'Voltaje', null, 'enum', '["110V", "220V Monofásico", "220V Trifásico"]'::jsonb, true, true, 0
from categories where name = 'Diagnóstico';
insert into attribute_definitions (category_id, key, label, unit, data_type, options, is_filterable, is_comparable, position)
select id, 'conectividad', 'Conectividad', null, 'enum', '["USB", "Bluetooth", "Wi-Fi", "USB y Bluetooth"]'::jsonb, true, true, 1
from categories where name = 'Diagnóstico';
insert into attribute_definitions (category_id, key, label, unit, data_type, options, is_filterable, is_comparable, position)
select id, 'peso', 'Peso', 'kg', 'number', null, false, true, 2
from categories where name = 'Diagnóstico';

insert into attribute_definitions (category_id, key, label, unit, data_type, options, is_filterable, is_comparable, position)
select id, 'voltaje', 'Voltaje', null, 'enum', '["No aplica (manual)", "110V", "220V Monofásico"]'::jsonb, true, true, 0
from categories where name = 'Herramientas de Taller';
insert into attribute_definitions (category_id, key, label, unit, data_type, options, is_filterable, is_comparable, position)
select id, 'peso', 'Peso', 'kg', 'number', null, false, true, 1
from categories where name = 'Herramientas de Taller';
insert into attribute_definitions (category_id, key, label, unit, data_type, options, is_filterable, is_comparable, position)
select id, 'material', 'Material', null, 'text', null, false, false, 2
from categories where name = 'Herramientas de Taller';

insert into attribute_definitions (category_id, key, label, unit, data_type, options, is_filterable, is_comparable, position)
select id, 'presentacion', 'Presentación', null, 'enum', '["Galón", "Litro", "Caja", "Unidad", "Kit"]'::jsonb, true, false, 0
from categories where name = 'Insumos y Consumibles';
insert into attribute_definitions (category_id, key, label, unit, data_type, options, is_filterable, is_comparable, position)
select id, 'contenido_neto', 'Contenido neto', null, 'text', null, false, false, 1
from categories where name = 'Insumos y Consumibles';

insert into attribute_definitions (category_id, key, label, unit, data_type, options, is_filterable, is_comparable, position)
select id, 'voltaje', 'Voltaje', null, 'enum', '["No aplica (manual)", "110V", "220V Monofásico", "220V Trifásico"]'::jsonb, true, true, 0
from categories where name = 'Lubricación';
insert into attribute_definitions (category_id, key, label, unit, data_type, options, is_filterable, is_comparable, position)
select id, 'capacidad', 'Capacidad', 'L', 'number', null, false, true, 1
from categories where name = 'Lubricación';
insert into attribute_definitions (category_id, key, label, unit, data_type, options, is_filterable, is_comparable, position)
select id, 'presion_trabajo', 'Presión de trabajo', 'PSI', 'number', null, false, true, 2
from categories where name = 'Lubricación';
