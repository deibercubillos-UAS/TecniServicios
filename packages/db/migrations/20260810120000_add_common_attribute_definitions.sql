-- Migración: add_common_attribute_definitions
-- Especificaciones adicionales verificadas contra fichas técnicas reales de
-- equipo de taller automotriz (alineadoras/balanceadoras John Bean, Hofmann,
-- Corghi; elevadores Launch, 1Lifts; scanners Foxwell, PCE; engrasadoras
-- Rexon/Total) — búsqueda web, no inventadas. docs/tasks siguiente.
-- Reversión: delete from attribute_definitions where key in
--   ('diametro_rueda','precision_medicion','altura_elevacion','protocolos',
--    'pantalla','presion_maxima','capacidad_flujo','caudal');

-- Alineación y Balanceo — diámetro/ancho de rueda y capacidad de carga son
-- las specs más citadas junto al voltaje ya existente.
insert into attribute_definitions (category_id, key, label, unit, data_type, options, is_filterable, is_comparable, position)
select id, 'capacidad_carga', 'Capacidad de carga', 'kg', 'number', null, false, true, 1
from categories where name = 'Alineación y Balanceo';
insert into attribute_definitions (category_id, key, label, unit, data_type, options, is_filterable, is_comparable, position)
select id, 'diametro_rueda', 'Diámetro de rueda', 'pulgadas', 'text', null, false, true, 2
from categories where name = 'Alineación y Balanceo';
insert into attribute_definitions (category_id, key, label, unit, data_type, options, is_filterable, is_comparable, position)
select id, 'precision_medicion', 'Precisión de medición', null, 'text', null, false, false, 3
from categories where name = 'Alineación y Balanceo';

-- Elevación — la altura de elevación es la spec más citada junto a
-- capacidad de carga y accionamiento, ya existentes.
insert into attribute_definitions (category_id, key, label, unit, data_type, options, is_filterable, is_comparable, position)
select id, 'altura_elevacion', 'Altura de elevación', 'mm', 'number', null, false, true, 3
from categories where name = 'Elevación';

-- Diagnóstico — protocolos soportados y pantalla son las specs que más
-- aparecen en fichas de scanners reales, junto a conectividad ya existente.
insert into attribute_definitions (category_id, key, label, unit, data_type, options, is_filterable, is_comparable, position)
select id, 'protocolos', 'Protocolos soportados', null, 'text', null, false, false, 3
from categories where name = 'Diagnóstico';
insert into attribute_definitions (category_id, key, label, unit, data_type, options, is_filterable, is_comparable, position)
select id, 'pantalla', 'Pantalla', null, 'text', null, false, false, 4
from categories where name = 'Diagnóstico';

-- Herramientas de Taller — cubre también equipo neumático (compresoras,
-- pistolas de impacto): presión máxima y capacidad de tanque/flujo son las
-- specs más citadas junto a voltaje/peso/material ya existentes.
insert into attribute_definitions (category_id, key, label, unit, data_type, options, is_filterable, is_comparable, position)
select id, 'presion_maxima', 'Presión máxima', 'PSI', 'number', null, false, true, 3
from categories where name = 'Herramientas de Taller';
insert into attribute_definitions (category_id, key, label, unit, data_type, options, is_filterable, is_comparable, position)
select id, 'capacidad_flujo', 'Capacidad / flujo', null, 'text', null, false, false, 4
from categories where name = 'Herramientas de Taller';

-- Lubricación — el caudal (g/min o L/min) es la spec más citada en
-- engrasadoras neumáticas reales, junto a capacidad y presión ya existentes.
insert into attribute_definitions (category_id, key, label, unit, data_type, options, is_filterable, is_comparable, position)
select id, 'caudal', 'Caudal', null, 'text', null, false, false, 3
from categories where name = 'Lubricación';
