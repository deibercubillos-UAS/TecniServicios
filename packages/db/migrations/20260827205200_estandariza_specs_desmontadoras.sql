-- Migración: estandariza_specs_desmontadoras
-- Aplicada: 2026-08-27, vía mcp__Supabase__apply_migration sobre el
-- proyecto tecni (sieiprqcvubkmrmvwwik).
-- El usuario pidió estandarizar 8 specs (todas opcionales) para
-- Desmontadoras: Diámetro (interior), Diámetro (externo), Poder,
-- Voltaje de motor, Nivel de ruido, Diámetro máximo rueda, Peso neto,
-- Tamaño del paquete. 4 de las 11 definiciones sembradas en
-- 20260817140000_seed_attribute_definitions_desmontadoras.sql se
-- solapan semánticamente (potencia_motor, nivel_ruido,
-- diametro_maximo, peso) — se actualizan en el lugar (mismo id, no se
-- pierde el histórico de product_attributes, que referencia por id no
-- por key). Las otras 4 son nuevas. Las 7 definiciones restantes
-- (sujecion_externa, sujecion_interna, ancho_maximo, presion_trabajo,
-- alimentacion, brazo_oscilante, inflado_talon) quedan intactas: son
-- datos de ficha técnica real ya verificados y el usuario no pidió
-- eliminarlos. Mismo patrón de texto libre sin unit (rangos/medidas
-- duales) que el resto de la categoría.
-- Reversión:
--   update attribute_definitions set key = 'potencia_motor', label = 'Potencia del motor', position = 7 where category_id = (select id from categories where slug = 'desmontadoras') and key = 'poder';
--   update attribute_definitions set label = 'Nivel de ruido', position = 5 where category_id = (select id from categories where slug = 'desmontadoras') and key = 'nivel_ruido';
--   update attribute_definitions set label = 'Diámetro máximo', position = 3 where category_id = (select id from categories where slug = 'desmontadoras') and key = 'diametro_maximo';
--   update attribute_definitions set key = 'peso', label = 'Peso', position = 8 where category_id = (select id from categories where slug = 'desmontadoras') and key = 'peso_neto';
--   delete from attribute_definitions where category_id = (select id from categories where slug = 'desmontadoras') and key in ('diametro_interior','diametro_exterior','voltaje_motor','tamano_paquete');

-- Actualiza en el lugar las 4 definiciones solapadas.
update attribute_definitions
set key = 'poder', label = 'Poder', position = 3
where category_id = (select id from categories where slug = 'desmontadoras') and key = 'potencia_motor';

update attribute_definitions
set label = 'Nivel de ruido', position = 5
where category_id = (select id from categories where slug = 'desmontadoras') and key = 'nivel_ruido';

update attribute_definitions
set label = 'Diámetro máximo rueda', position = 6
where category_id = (select id from categories where slug = 'desmontadoras') and key = 'diametro_maximo';

update attribute_definitions
set key = 'peso_neto', label = 'Peso neto', position = 7
where category_id = (select id from categories where slug = 'desmontadoras') and key = 'peso';

-- Crea las 4 definiciones nuevas.
insert into attribute_definitions (category_id, key, label, unit, data_type, options, is_filterable, is_comparable, position)
select id, 'diametro_interior', 'Diámetro (interior)', null, 'text', null, false, true, 1
from categories where slug = 'desmontadoras';
insert into attribute_definitions (category_id, key, label, unit, data_type, options, is_filterable, is_comparable, position)
select id, 'diametro_exterior', 'Diámetro (externo)', null, 'text', null, false, true, 2
from categories where slug = 'desmontadoras';
insert into attribute_definitions (category_id, key, label, unit, data_type, options, is_filterable, is_comparable, position)
select id, 'voltaje_motor', 'Voltaje de motor', null, 'text', null, false, false, 4
from categories where slug = 'desmontadoras';
insert into attribute_definitions (category_id, key, label, unit, data_type, options, is_filterable, is_comparable, position)
select id, 'tamano_paquete', 'Tamaño del paquete', null, 'text', null, false, false, 8
from categories where slug = 'desmontadoras';

-- Reordena las definiciones legacy no solapadas para que queden
-- después de las 8 estandarizadas.
update attribute_definitions set position = 9 where category_id = (select id from categories where slug = 'desmontadoras') and key = 'sujecion_externa';
update attribute_definitions set position = 10 where category_id = (select id from categories where slug = 'desmontadoras') and key = 'sujecion_interna';
update attribute_definitions set position = 11 where category_id = (select id from categories where slug = 'desmontadoras') and key = 'ancho_maximo';
update attribute_definitions set position = 12 where category_id = (select id from categories where slug = 'desmontadoras') and key = 'presion_trabajo';
update attribute_definitions set position = 13 where category_id = (select id from categories where slug = 'desmontadoras') and key = 'alimentacion';
update attribute_definitions set position = 14 where category_id = (select id from categories where slug = 'desmontadoras') and key = 'brazo_oscilante';
update attribute_definitions set position = 15 where category_id = (select id from categories where slug = 'desmontadoras') and key = 'inflado_talon';
