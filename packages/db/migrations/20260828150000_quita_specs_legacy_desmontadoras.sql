-- Migración: quita_specs_legacy_desmontadoras
-- Aplicada: 2026-08-28, vía mcp__Supabase__apply_migration sobre el
-- proyecto tecni (sieiprqcvubkmrmvwwik).
-- El usuario pidió quitar 7 especificaciones legacy de Desmontadoras
-- que se habían dejado intactas en
-- 20260827205200_estandariza_specs_desmontadoras.sql (no pedidas en
-- ese momento, pero tampoco se pidió eliminarlas). Ahora sí se pidió
-- explícitamente: Sujeción externa, Sujeción interna, Ancho máximo,
-- Presión de trabajo, Alimentación (opcional), Brazo oscilante,
-- Inflado de talón (opcional). `product_attributes.definition_id`
-- tiene `on delete cascade`, así que borrar la definición borra
-- también los valores cargados en TECNI-301/302 y TECNIMAX-302 para
-- estos campos — es el efecto esperado al quitar una spec, no un
-- efecto secundario.
-- Reversión: no trivial (se perderían los datos ya borrados). Recrear
-- las definiciones con
-- packages/db/migrations/20260827205200_estandariza_specs_desmontadoras.sql
-- (bloque de las 7 definiciones legacy) y volver a cargar los valores
-- manualmente desde /admin/productos/[id]#especificaciones.

delete from attribute_definitions
where category_id = (select id from categories where slug = 'desmontadoras')
  and key in ('sujecion_externa', 'sujecion_interna', 'ancho_maximo', 'presion_trabajo', 'alimentacion', 'brazo_oscilante', 'inflado_talon');
