# Changelog (parte C)

Parte B (Fase 4 en adelante): [`CHANGELOG-B.md`](./CHANGELOG-B.md)

---

## 2026-08-16 — Imagen "principal" e imagen de "hero de categoría" por separado

Nueva columna `is_hero` en `product_images` (backfill desde
`is_primary`, sin regresión visual al desplegar), función
`setHeroProductImage` en `packages/core` paralela a
`setPrimaryProductImage`, nueva server action y botón "Usar en hero" en
`/admin/productos/[id]` junto al badge/botón existente de "Principal".
La página de categoría (`/catalogo/categoria/[slug]`) ahora construye
dos mapas de imagen por producto: uno por `is_primary` (grid, sin
cambio) y otro por `is_hero` (alimenta `ProductCoverflowHero`). El
resto del sitio (ficha, carrito, cotizaciones, home, "mis equipos")
sigue usando `is_primary` exactamente igual que antes.

Verificado extremo a extremo contra la base real: marcar una foto
distinta como hero para "Hunter HawkEye Elite®" hace que el hero de
categoría muestre la foto ambiente mientras la ficha del producto
sigue mostrando la foto de estudio como principal.

Ver `docs/tasks/done/DONE-imagen-hero-producto.md` para el plan
completo y la bitácora.

## 2026-08-16 — Reorganiza la edición de producto en el panel maestro

`/admin/productos/[id]` pasa de 7 secciones siempre expandidas (mucho
scroll, sin forma de ver de un vistazo qué faltaba) a: un menú de
anclas arriba, "Datos básicos" con sus 4 checkboxes reagrupados en 3
bloques claros (Tipo de contenido / Visibilidad / Destacados en el
sitio), y el resto de secciones (Imágenes, Especificaciones, Video,
Beneficios, Manual, Zona de peligro) como `<details>/<summary>` nativo
con resumen de estado (ej. "Imágenes (4)", "Especificaciones
(6/12 completas)") — sin JavaScript, mismo patrón ya usado en
`admin/auditoria`, evitando una séptima excepción a "Server Components
por defecto". Cada sección se abre sola cuando está incompleta o tras
guardar algo en ella; "Zona de peligro" siempre cerrada por defecto.

Ver `docs/tasks/done/DONE-reorganizar-edicion-producto.md` para el
plan completo y la bitácora.

## 2026-08-16 — Intervalo de mantenimiento preventivo editable + recordatorio por correo

Master fija cada cuántos meses un equipo (`owned_equipment`) requiere
mantenimiento preventivo desde la nueva sección `/admin/equipos`
(`setMaintenanceInterval` en `packages/core`); `next_maintenance_due_at`
se calcula solo (nunca se edita a mano) desde el último mantenimiento
completado o la fecha de entrega, y se reinicia automáticamente cada
vez que `completeMaintenance` cierra una visita real. Un cron diario
(primero del proyecto, `apps/web/vercel.json` +
`/api/cron/maintenance-reminders`, protegido con `CRON_SECRET`) revisa
qué equipos vencen en 15 días y envía un correo a la empresa dueña vía
Resend (primera integración de correo real del proyecto,
`packages/integrations/src/resend/client.ts`, nuevo
`docs/10-INTEGRATION-RESEND.md`) — idempotente por
`maintenance_reminder_sent_for`, así no se reenvía el mismo aviso. El
cliente ve la fecha (solo lectura) en `/mi-cuenta/equipos/[id]`.

Verificado extremo a extremo por SQL directa sobre un equipo real: la
consulta del cron selecciona correctamente un vencimiento a 15 días y
dejar de seleccionarlo tras marcarlo como ya avisado. **Resend todavía
no está configurado en Vercel** — el usuario debe crear
`RESEND_API_KEY`, `RESEND_FROM_EMAIL` y `CRON_SECRET` para que el
envío real empiece a funcionar; hasta entonces el intervalo se edita y
calcula igual, solo el correo queda pendiente.

Ver `docs/tasks/done/DONE-mantenimiento-preventivo-recordatorio.md`
para el plan completo y la bitácora.

## 2026-08-16 — Categoría "Desmontadoras" + producto TECNIMAX-302

Nueva categoría "Desmontadoras" con 11 especificaciones técnicas
verificadas contra una ficha real (TECNIMAX-302, catálogo propio de
TecniServicios), y el producto TECNIMAX-302 cargado con esos valores
(sin precio todavía — se sincroniza vía Siigo). Bug encontrado y
corregido en el momento: las especificaciones con rango/doble-unidad
traían la unidad embebida en el texto y también en la columna `unit`,
duplicándola visualmente en la ficha pública — corregido dejando
`unit = null` en esas definiciones.

Falta subir la foto del producto — no pude hacerlo yo, las credenciales
R2 están enmascaradas en el entorno local por diseño; queda para que el
usuario la suba desde `/admin/productos/[id]`.

Ver `docs/tasks/ACTIVE-categoria-desmontadoras.md` (sigue activa hasta
que se suba la foto) para el plan completo y la bitácora.

Segunda ficha del usuario, mismas specs, marca/modelo distinto
(TECNI-302, no TECNIMAX-302) — confirmado como producto aparte, no
corrección de nombre. Cargado igual: marca "TECNI", producto
`tecni-302` con sus 11 `product_attributes`, foto extraída y enviada al
usuario. La categoría "Desmontadoras" ya muestra las 2 referencias.

## 2026-08-16 — Incidente: variable de entorno vacía tumbaba el sitio

`CRON_SECRET` quedó creada vacía en Vercel; la validación de entorno
(lanza al importarse) crasheaba `/middleware` en todas las rutas — 500
en todo el sitio, ~400 errores en 30 minutos. `z.optional()` de Zod
solo acepta `undefined`, no `""`. Corregido normalizando el entorno
(cadenas vacías → `undefined`) una sola vez antes de validar, para
cualquier variable opcional. Verificado con el escenario exacto del
incidente reproducido localmente, y con logs de producción limpios
tras el redeploy.

## 2026-08-17 — Reordenar categorías desde el panel + navbar "Productos"

Master puede subir/bajar categorías desde `/admin/categorias` (lista
ordenada por `position`, botones ▲/▼ deshabilitados en los extremos —
`moveCategory` intercambia `position` con el vecino adyacente, sin
drag-and-drop client-side). El link "Catálogo" del navbar pasa a
llamarse "Productos" (mismo destino `/catalogo`); footer, breadcrumbs
y títulos de página se dejan igual, son otra cosa.

Ver `docs/tasks/done/DONE-reordenar-categorias-navbar.md` para el plan
completo y la bitácora.

## 2026-08-17 — Hero del home editable por master (título, descripción, botones)

El panel de texto fijo del hero del home (título, descripción, 2
botones) vivía hardcodeado en `hero-carousel.tsx`, sin relación con
ninguna tabla — el master ya podía editar la foto (`/admin/banners`)
pero no el texto. Se reusa el sistema genérico de `settings`
(`/admin/configuracion`, mismo que ya usan `/contacto` y el footer) en
vez de crear un mecanismo nuevo: nueva sección "Hero del home" con
título, descripción (textarea) y 2 botones con texto+enlace+on/off
cada uno (nuevos tipos `boolean`/`textarea` en el sistema de settings).
Sembrado con el copy original — cero regresión visual.

Verificado extremo a extremo simulando una edición real: cambiar el
título y apagar un botón se reflejó de inmediato en el home, sin dejar
hueco donde estaba el botón desactivado.

Ver `docs/tasks/done/DONE-hero-home-editable.md` para el plan completo
y la bitácora.

## 2026-08-17 — Ajustes al hero editable: título en dos líneas, sin texto sobre la foto

Dos mejoras pedidas sobre la tarea anterior: (1) el título vuelve a
tener dos líneas como el original (`home_hero_title_line1` en blanco,
`home_hero_title_line2` en rojo — reemplaza `home_hero_title`, una sola
migración de datos); (2) se quita el degradado + texto que aparecía
sobre la foto del carrusel derecho (`slide.title` seguía usándose para
`alt`/`aria-label`, solo se quitó el overlay visual). Verificado en
build de producción real: título en dos líneas con los colores
correctos, foto del banner sin ningún texto encima.

## 2026-08-17 — Badge del hero editable (última pieza del panel de texto)

`home_hero_badge_label` — el badge superior ("Equipamiento industrial
para talleres") era lo único del panel de texto fijo del hero que
seguía hardcodeado; ahora es un campo más de "Hero del home" en
`/admin/configuracion`. Con esto todo el bloque de texto (badge,
título en 2 líneas, descripción, 2 botones) es editable, manteniendo
la paleta de colores actual sin exponer selección de color al master
(pedido explícito). Verificado extremo a extremo con un cambio de
prueba vía SQL directa, revertido al cerrar.
