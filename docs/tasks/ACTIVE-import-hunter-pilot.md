# TAREA: Piloto de datos reales — 12 productos Hunter Engineering

**Estado:** Pausada · **Riesgo:** Grande (crea marca/productos/imágenes reales en producción, usa credenciales de servicio)
**Inicio:** 2026-08-11 · **Última actualización:** 2026-08-16

**Pausas por tareas de frontend urgentes (2026-08-15/16, cinco veces):**
ver `docs/tasks/done/DONE-mejoras-navbar-hero-categorias.md`,
`docs/tasks/done/DONE-landing-categorias.md`,
`docs/tasks/done/DONE-drag-carousel-dropdown-catalogo.md`,
`docs/tasks/done/DONE-cierre-brechas-ux-hunter.md` (cerradas) y ahora
`ACTIVE-pagina-dedicada-categoria.md`. Se retoma al cerrar esa. Sigue
pendiente el paso 2.3 (subir las fotos restantes, bloqueado en el
usuario).

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

### 2026-08-11 — enriquecimiento de specs y fotos adicionales

- **Hecho:** a pedido del usuario ("las especificaciones están pobres...
  mínimo 5 imágenes"), se leyó la ficha técnica PDF real de HawkEye Elite
  (`hunter-specs/hawkeye-elite-specs.pdf`, no redistribuida, solo datos
  extraídos: cámaras 20MP, medición en 70s, instalación de objetivo en
  5s, pesos y dimensiones por configuración) y se buscaron 4-5 fotos
  reales adicionales por producto donde el sitio las exponía sin bloqueo
  de cookie.
- **Resultado real (no se alcanzó 5 fotos parejo en los 12):** HawkEye XL
  5 fotos, Revolution 4, tijera 2, el resto 1 foto — varias páginas de
  Hunter solo tienen imágenes de fondo con parámetros de sesión que el
  navegador bloquea al leer `src`, sin galería de producto aparte. Se
  reportó esto explícito al usuario en `MAPEO-SKU-v2.md` en vez de
  rellenar con fotos irrelevantes o repetidas.
- **Specs enriquecidas** (con datos reales, verificados en la página o el
  PDF): HawkEye Elite (resolución de cámara, tiempos, pesos por
  configuración), HawkEye XL (capacidad 10 000 kg/eje — antes sin dato),
  Elevadores de tijera (opciones reales: InflationStation, PowerSlide,
  AlignLights).
- **Commit:** pendiente.

### 2026-08-12 — incidente: sitio caído por R2_PUBLIC_URL mal formada

- **Síntoma reportado por el usuario:** falla al subir fotos de producto.
- **Causa real (más grave que el síntoma):** `R2_PUBLIC_URL` en Vercel
  guardada como `assets.tecnisas.co` (sin esquema `https://`). Falla la
  validación Zod (`z.url()`) en `packages/shared/src/env.ts`, que corre
  al importar el módulo — como `middleware.ts` lo importa, **cada
  request a producción tiraba error 500**, no solo la subida de fotos.
  Confirmado con `get_runtime_errors` (Vercel): 21 errores en
  `/middleware` y `/_not-found` en la ventana de los últimos minutos.
- **Corrección:** `vercel env rm/add R2_PUBLIC_URL` con el valor correcto
  `https://assets.tecnisas.co` (Production + Preview), luego
  `vercel deploy --prod` para tomar el nuevo valor.
- **Verificación:** `get_runtime_errors` sin errores nuevos tras el
  deploy; `https://www.tecnisas.co/` responde 200; `https://
  assets.tecnisas.co/` responde 404 con `server: cloudflare` (dominio
  conectado al bucket R2 `tecni-assets`, 404 es normal en la raíz sin
  objeto).
- **Esto NO resolvió el bug que reportó el usuario** — el sitio funcionaba
  pero la subida de fotos seguía fallando. Ver incidentes siguientes.

### 2026-08-12 — incidente 2: regla de Cloudflare rota bloqueaba subidas (403)

- **Síntoma:** con el sitio ya funcionando, subir una foto seguía dando
  "Algo salió mal" / "An unexpected response was received from the
  server.".
- **Diagnóstico:** `read_network_requests` en el navegador (con sesión
  real de master) mostró el POST a `/admin/productos/[id]` devolviendo
  **403**. `get_runtime_errors`/`get_runtime_logs` de Vercel **no
  registraban ninguna invocación de función para ese 403** — la petición
  nunca llegó a la app. Eso descartó el `allowedOrigins` de Server
  Actions (commit `e360fb4`, ya desplegado) como causa: si fuera eso,
  Vercel sí habría logueado la función respondiendo 403.
- **Causa real:** en Cloudflare (Security rules de `tecnisas.co`) existía
  una regla `allow-admin-uploads` (acción `Skip`, para saltar WAF/Super
  Bot Fight Mode en subidas de admin) pero su tercera condición
  `Request Method equals` tenía el **valor vacío** (`http.request.method
  eq ""`) — nunca coincidía con nada (0 eventos desde su creación), así
  que la protección que debía saltarse seguía bloqueando el POST.
- **Corrección:** en el editor de la regla, se fijó el valor a `POST`
  (expresión final: `http.host eq "www.tecnisas.co" and
  http.request.uri.path contains "/admin/" and http.request.method eq
  "POST"`), manteniendo el resto de la configuración (Skip: All managed
  rules, All Super Bot Fight Mode Rules, All remaining custom rules;
  orden First; Active).
- **Verificación:** reintento de subida → pasó de 403 a 500 (la petición
  ya llega a la app). Ver incidente 3.

### 2026-08-12 — incidente 3: límite de tamaño de Server Actions (500/413)

- **Síntoma:** tras el fix de Cloudflare, la subida daba 500.
- **Causa:** `get_runtime_errors` mostró `Error: Body exceeded 1 MB
  limit.` (413) — el límite por defecto de Next.js para Server Actions es
  1 MB, y la foto de prueba pesaba 1038 KB.
- **Corrección:** `apps/web/next.config.ts` — `experimental.serverActions.
  bodySizeLimit: "4mb"` (tope real utilizable: Vercel limita a 4.5 MB por
  request en funciones Serverless en planes no-Enterprise, así que 4mb es
  el máximo seguro, no una elección arbitraria).
- **Verificación end-to-end:** subida real de `hawkeye-elite.jpg` (1038
  KB) desde `/admin/productos/02baa17d-.../` con sesión de master →
  `?imagesUploaded=1`, imagen visible marcada "Principal". **Confirmado
  funcionando en producción.**

## Pendiente para el usuario

- Subir las 11 fotos restantes desde `/admin/productos/[id]` (mapeo en
  `MAPEO-SKU.md`/`MAPEO-SKU-v2.md` ya entregados) — ya no debería fallar.
- Si sube varias fotos pesadas a la vez en un mismo producto, tenerlo en
  cuenta contra el límite de 4 MB por request (subir en tandas si hace
  falta).

## Pendientes descubiertos

- Los PDF de fichas técnicas/folletos de Hunter no se cargaron (decisión
  de esta tarea). Si el master quiere completar más specs, tendría que
  transcribirlas manualmente desde esos documentos.
- Escalar el piloto a más productos/categorías es una tarea nueva, no una
  continuación automática de esta.
- Confirmar que las 12 fotos quedaron subidas (`product_images`) antes de
  publicar (`is_active=true`) cualquiera de los 12 productos.
