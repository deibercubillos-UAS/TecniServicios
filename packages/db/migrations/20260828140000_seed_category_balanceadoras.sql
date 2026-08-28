-- Migración: seed_category_balanceadoras
-- Aplicada: 2026-08-28, vía mcp__Supabase__apply_migration sobre el
-- proyecto tecni (sieiprqcvubkmrmvwwik).
-- El usuario pidió 12 specs propias para "Balanceadoras" — no existía
-- como categoría separada, estaba mezclada con Alineación
-- (alineacion-balanceo, que ya tiene 4 specs genéricas de ambos tipos
-- de equipo). Se confirmó con el usuario crearla aparte para no
-- mezclar specs de balanceo con las fichas de alineadoras existentes.
-- Mismo patrón que 20260817130000_seed_category_desmontadoras.sql.
-- Los 2 productos "Balanceadora ..." actuales (BAL-COR-900,
-- BAL-HOF-GEO) ya estaban eliminados (deleted_at) al momento de esta
-- migración — no hay productos activos que mover a la categoría
-- nueva; el master la asigna manualmente al crear/reactivar productos
-- de balanceo.
-- Reversión: delete from categories where slug = 'balanceadoras';
--   (elimina también sus attribute_definitions vía on delete cascade)

insert into categories (slug, name, description, position)
values (
  'balanceadoras',
  'Balanceadoras',
  'Balanceadoras de ruedas para turismos y vehículos ligeros.',
  8
);

insert into attribute_definitions (category_id, key, label, unit, data_type, options, is_filterable, is_comparable, position)
select id, 'poder', 'Poder', null, 'text', null, false, true, 1
from categories where slug = 'balanceadoras';
insert into attribute_definitions (category_id, key, label, unit, data_type, options, is_filterable, is_comparable, position)
select id, 'velocidad_balanceo', 'Velocidad de balanceo', null, 'text', null, false, true, 2
from categories where slug = 'balanceadoras';
insert into attribute_definitions (category_id, key, label, unit, data_type, options, is_filterable, is_comparable, position)
select id, 'precision_balanceo', 'Precisión de balanceo', null, 'text', null, false, true, 3
from categories where slug = 'balanceadoras';
insert into attribute_definitions (category_id, key, label, unit, data_type, options, is_filterable, is_comparable, position)
select id, 'diametro_rin', 'Diámetro del rin', null, 'text', null, false, true, 4
from categories where slug = 'balanceadoras';
insert into attribute_definitions (category_id, key, label, unit, data_type, options, is_filterable, is_comparable, position)
select id, 'ancho_rin', 'Ancho del rin', null, 'text', null, false, true, 5
from categories where slug = 'balanceadoras';
insert into attribute_definitions (category_id, key, label, unit, data_type, options, is_filterable, is_comparable, position)
select id, 'peso_llanta', 'Peso de la llanta', null, 'text', null, false, false, 6
from categories where slug = 'balanceadoras';
insert into attribute_definitions (category_id, key, label, unit, data_type, options, is_filterable, is_comparable, position)
select id, 'tiempo_ciclo', 'Tiempo de ciclo', null, 'text', null, false, true, 7
from categories where slug = 'balanceadoras';
insert into attribute_definitions (category_id, key, label, unit, data_type, options, is_filterable, is_comparable, position)
select id, 'ruido', 'Ruido', null, 'text', null, false, false, 8
from categories where slug = 'balanceadoras';
insert into attribute_definitions (category_id, key, label, unit, data_type, options, is_filterable, is_comparable, position)
select id, 'peso_neto', 'Peso neto', null, 'text', null, false, true, 9
from categories where slug = 'balanceadoras';
insert into attribute_definitions (category_id, key, label, unit, data_type, options, is_filterable, is_comparable, position)
select id, 'temperatura_trabajo', 'Temperatura de trabajo', null, 'text', null, false, false, 10
from categories where slug = 'balanceadoras';
insert into attribute_definitions (category_id, key, label, unit, data_type, options, is_filterable, is_comparable, position)
select id, 'tamano_empaque', 'Tamaño del empaque', null, 'text', null, false, false, 11
from categories where slug = 'balanceadoras';
insert into attribute_definitions (category_id, key, label, unit, data_type, options, is_filterable, is_comparable, position)
select id, 'voltaje', 'Voltaje', null, 'text', null, false, false, 12
from categories where slug = 'balanceadoras';
