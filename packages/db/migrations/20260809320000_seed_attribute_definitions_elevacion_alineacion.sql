-- Migración: seed_attribute_definitions_elevacion_alineacion
-- El sidebar de filtros (apps/web/app/(public)/catalogo/page.tsx) ya
-- renderizaba una sección de atributos filtrables por categoría, pero
-- attribute_definitions estaba vacía desde su creación en la Fase 2 —
-- el filtro nunca aparecía para ningún usuario real. Se agregan
-- definiciones reales (voltaje, tipo de accionamiento, capacidad de
-- carga) para Elevación y Alineación y Balanceo, las dos categorías
-- del catálogo donde esos atributos son specs técnicas reales de los
-- equipos, no un dato inventado sin respaldo de producto.
-- Reversión: delete from attribute_definitions where category_id in
--   (select id from categories where slug in ('elevacion','alineacion-balanceo'));
--   (product_attributes se borra en cascada por FK on delete cascade)

insert into attribute_definitions (category_id, key, label, unit, data_type, options, is_filterable, is_comparable, position)
select id, 'voltaje', 'Voltaje', null, 'enum', '["110V","220V Monofásico","220V Trifásico"]'::jsonb, true, true, 0
from categories where slug = 'elevacion'
union all
select id, 'accionamiento', 'Accionamiento', null, 'enum', '["Hidráulico","Electrohidráulico"]'::jsonb, true, true, 1
from categories where slug = 'elevacion'
union all
select id, 'capacidad_carga', 'Capacidad de carga', 'kg', 'number', null, true, true, 2
from categories where slug = 'elevacion'
union all
select id, 'voltaje', 'Voltaje', null, 'enum', '["110V","220V Monofásico","220V Trifásico"]'::jsonb, true, true, 0
from categories where slug = 'alineacion-balanceo';
