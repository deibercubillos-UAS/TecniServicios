# TAREA: Piloto de datos reales — 12 productos Hunter Engineering

**Estado:** En curso · **Riesgo:** Grande (crea marca/productos/imágenes reales en producción, usa credenciales de servicio)
**Inicio:** 2026-08-11 · **Última actualización:** 2026-08-11

## Objetivo

Cargar 12 productos reales de Hunter Engineering (subdealer autorizado a usar
sus fotos) como borrador, con foto real y las especificaciones que sí
aparecen como dato concreto en la página pública de cada uno, para empezar
a alimentar el catálogo con datos e imágenes reales en vez de vacío.

**No entra en esta tarea:** publicar los productos (`is_active=true` — eso
lo decide el master desde `/admin/productos` tras revisar), descargar o
redistribuir los PDF de fichas técnicas de Hunter, ni copiar el copy de
marketing de Hunter textualmente.

## Documentos consultados

- `docs/11-STORAGE-R2.md` — la ficha técnica se llena campo por campo,
  nunca se sube el PDF del fabricante.
- `docs/04-DATABASE-SCHEMA-A.md` — esquema de `products`/`brands`/
  `attribute_definitions`.
- Reglas de negocio 5.3 de `CLAUDE.md` — el master es dueño del contenido
  del catálogo; el precio nunca se toca a mano (viene de Siigo).

## Decisiones tomadas durante la ejecución

- 2026-08-11: usuario confirmó ser **subdealer** de Hunter con derecho a
  usar sus fotos de producto, sin acceso a portal de dealer — por eso se
  descargan las fotos del sitio público en vez de un kit de prensa.
- 2026-08-11: las fichas técnicas en PDF (folletos, especificaciones) NO
  se descargan ni redistribuyen — solo se transcriben a
  `product_attributes` los valores numéricos/textuales que aparecen
  visibles en el HTML de cada página (no en un documento descargable).
  Donde no hay dato visible, el campo queda vacío, nunca inventado.
- 2026-08-11: las descripciones (`short_description`/`description`) se
  redactan en palabras propias a partir de los hechos de cada página, no
  se copia el copy de marketing de Hunter verbatim.
- 2026-08-11: R2 no estaba configurado en Vercel — el usuario lo configuró
  durante esta sesión (bucket + 5 variables `R2_*`), confirmado con
  `vercel env ls`.
- 2026-08-11: todos los productos se crean con `is_active=false`
  (borrador) — el master revisa y publica desde el panel antes de que
  sean visibles públicamente.

---

## Plan

### Fase 1 — Scraping de datos reales

- [x] **1.1** Mapear categorías de Hunter (Alineación y ADAS, Cambiadoras
      de neumáticos, Balanceadoras de ruedas, Rampas de alineación) a
      nuestras categorías (`alineacion-balanceo`, `elevacion`).
- [x] **1.2** Extraer nombre, descripción factual e imagen "navigation-
      product-*" (foto limpia de catálogo) de 12 productos vía
      `claude-in-chrome` + `javascript_tool`.
  - Verificación: 12 imágenes descargadas en scratchpad, specs reales
    anotadas solo donde el HTML las mostraba explícitamente.

### Fase 2 — Carga a producción

- [x] **2.1** `vercel env pull` para obtener credenciales de Supabase/R2
      localmente (nunca pegadas en el chat).
- [x] **2.2** Crear marca "Hunter Engineering" y 12 productos borrador con
      specs reales vía `mcp__Supabase__execute_sql` (acceso directo, no
      requiere las variables enmascaradas).
  - Verificación: `select sku,name,is_active from products where sku like
    'HUNTER-%'` devuelve 12 filas con `is_active=false`. 14 filas en
    `product_attributes` con datos reales (diámetro de rin, capacidad de
    elevación, precisión de balanceo).
  - Reversión: `delete from products where sku like 'HUNTER-%'` (cascada
    borra specs; sin imágenes en R2 todavía, nada que limpiar ahí).
- [ ] **2.3** Subir las 12 fotos (no ejecutable por mí — ver bloqueo).
      Entregadas al usuario vía `SendUserFile` con `MAPEO-SKU.md` para
      subir manualmente desde `/admin/productos/[id]` por SKU.
  - Verificación: cada uno de los 12 SKU tiene al menos 1 fila en
    `product_images` con `is_primary=true`.
  - Reversión: borrar la imagen desde el mismo panel (`deleteProductImageAction`).

---

## Bitácora

### 2026-08-11 — Fase 1 y 2.1

- **Hecho:** scraping de 12 productos (nombre, descripción propia, specs
  visibles, imagen), descarga de imágenes a scratchpad, sincronización de
  credenciales de Vercel (Supabase + R2) a `.env.local` (gitignorado).
- **Resultado:** listo para ejecutar la carga (paso 2.2).

### 2026-08-11 — pasos 2.2 y 2.3

- **Hecho:** marca + 12 productos borrador + 14 specs reales creados
  directo en Supabase vía MCP. Se escribió
  `packages/integrations/scripts/import-hunter-pilot.mjs` (queda como
  referencia/reutilizable) pero **no pudo ejecutarse**: `vercel env pull`
  devuelve `"[SENSITIVE]"` en vez del valor real para toda variable
  marcada como "Sensitive" en Vercel (`SUPABASE_SERVICE_ROLE_KEY`, las
  3 `R2_*` sensibles) — es cifrado de la plataforma, no un problema de
  permisos de esta sesión: esas variables solo se descifran dentro del
  runtime de una función desplegada en Vercel, nunca por CLI/dashboard
  una vez guardadas.
- **Resultado:** las 12 fotos se descargaron y se entregaron al usuario
  (`SendUserFile`) con `MAPEO-SKU.md` para que las suba manualmente desde
  `/admin/productos/[id]` — ese formulario sí corre dentro del runtime de
  Vercel y descifra las variables sin problema.
- **Commit:** pendiente.

## Bloqueos

- Ninguno para las fotos (camino alterno via panel admin ya identificado
  y comunicado). El script `.mjs` queda bloqueado para uso local por el
  cifrado de variables sensibles de Vercel — solo sirve corrido dentro de
  un entorno que las descifre (p. ej. como parte de un Server Action o un
  Vercel Function, no como script standalone).

## Pendientes descubiertos

- Los PDF de fichas técnicas/folletos de Hunter no se cargaron (decisión
  de esta tarea). Si el master quiere completar más specs, tendría que
  transcribirlas manualmente desde esos documentos.
- Escalar el piloto a más productos/categorías es una tarea nueva, no una
  continuación automática de esta.
- Confirmar que las 12 fotos quedaron subidas (`product_images`) antes de
  publicar (`is_active=true`) cualquiera de los 12 productos.
