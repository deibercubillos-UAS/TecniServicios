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

## 2026-08-17 — El texto del hero se mueve de Configuración a Banners

Pedido explícito del usuario: el formulario "Hero del home" (badge,
título en 2 líneas, descripción, 2 botones) deja de vivir en
`/admin/configuracion` y pasa a `/admin/banners`, dentro de la tarjeta
"Banners superiores (Home)" — junto a las fotos del mismo hero, no
separado. Mismos datos (`settings`, prefijo `home_hero_%`), mismo
`updateSetting` de `packages/core` — solo cambia el archivo que renderiza
el formulario y qué server action lo guarda
(`updateHeroTextAction` en `admin/banners/actions.ts`). Se extrajo un
componente compartido `SettingFieldInput` para no duplicar el render de
texto/textarea/checkbox entre Configuración y Banners.

Verificado: `/admin/configuracion` ya no muestra la sección; build de
producción real confirma que el home se sigue viendo exactamente igual
(mismos datos, ninguna migración de contenido).

## 2026-08-17 — Grupos del menú del panel colapsables

`DashboardShell` (`apps/web/components/dashboard-shell.tsx`, sidebar
compartido de master/vendedor/técnico/cliente) ya tenía un colapso
completo a modo ícono; ahora cada grupo con etiqueta (Catálogo,
Contenido, Administración, etc.) se puede contraer por separado con un
clic en su título — útil para master, que ya tiene varios grupos con
muchos ítems. Estado persistido en `localStorage`
(`tecni-dashboard-collapsed-sections`), y un grupo colapsado que
contiene la página activa se muestra igual abierto — nunca esconde
dónde está el usuario. Mismo componente en el drawer móvil.

## 2026-08-17 — El texto del hero se mueve de la lista al detalle de banner

El usuario no quería el formulario "Texto del hero" en la lista de
`/admin/banners` (ocupaba mucho espacio visual siempre visible). Se
mueve a `/admin/banners/[id]` (para cualquier banner "Home hero") y a
`/admin/banners/nuevo?placement=home_hero`, en ambos casos dentro de un
`<details>` colapsado por defecto (mismo patrón de "Reorganizar
edición producto"). El texto sigue siendo un único dato compartido por
todas las fotos del hero (no por banner) — el formulario lo aclara
explícitamente y guarda vía la misma `updateHeroTextAction`, que ahora
redirige de vuelta a la página desde donde se llamó (`returnTo`) en
vez de siempre a la lista.

## 2026-08-17 — "Datos básicos" del banner se reduce a solo Activo (Home hero)

Pedido explícito del usuario, con dos preguntas de confirmación de por
medio (el alcance completo, y cómo resolver la pérdida del único campo
realmente indispensable): para banners de "Home hero" se quita título,
enlace, ubicación (queda fija, con nota para poder cambiarla al crear
si hace falta), posición y vigencia — solo queda el checkbox "Activo",
mínimo indispensable para poder publicar/ocultar una foto (nace
inactiva). Posición y ubicación se preservan vía campos ocultos (no se
resetean al guardar); título/enlace/vigencia simplemente dejan de
editarse desde la UI, sin borrar lo que ya tuvieran guardado. El resto
de ubicaciones de banner (franja de anuncio, categoría, etc.) no
cambian — mismos campos de siempre.

**Trade-off aceptado explícitamente por el usuario:** sin posición
editable, el orden entre varias fotos del hero ya no se puede ajustar
desde el panel (solo con acceso directo a la base).

## 2026-08-16 — SEO y rendimiento: `next/image`, Open Graph, sitemap de categorías

Corrige los 7 hallazgos reales de una auditoría de SEO/rendimiento:
migra las ~14 imágenes `<img>` de páginas públicas a `next/image`
(catálogo, ficha de producto, categoría, home, blog, calculadora),
agrega Open Graph/Twitter card a catálogo/categoría/home, agrega las
categorías activas al sitemap, agrega `BreadcrumbList` (JSON-LD) a
catálogo y categoría, y `preconnect`/`dns-prefetch` al host de R2.
Detalle completo en `docs/tasks/done/DONE-seo-rendimiento.md`.

**Bug real encontrado y corregido durante la verificación:** varios
productos usan `placehold.co` como imagen (brecha de datos conocida,
sin foto real subida todavía). Al migrar a `next/image` esas imágenes
empezaron a devolver 400 — la causa no era solo el host faltante en
`images.remotePatterns` (ya corregido), sino que `placehold.co` sirve
SVG y el optimizador de Next bloquea SVG remoto por defecto. Se
permite explícitamente con `dangerouslyAllowSVG` + una
`contentSecurityPolicy` estricta dedicada a las imágenes optimizadas.

## 2026-08-16 — Estilo visual de master aplicado a vendedor/técnico/cliente

Pedido explícito del usuario: parejar el estilo visual del panel
master (`StatCard`, listas con card + filtros + paginación,
`StatusBadge` con ícono) en `/ventas` (vendedor) y `/tecnico`
(técnico), que se habían quedado con el patrón anterior (listas
`<ul>` planas, badges de solo texto, sin filtros ni paginación, y
labels de estado duplicados a mano en vez de los helpers compartidos
`@/lib/order-status`/`ticket-status`/`maintenance-status`). Solo
cambia estilo — ninguna acción ni alcance de datos se replicó, RLS sin
cambios. `/mi-cuenta` (cliente) ya estaba alineado, no necesitó
cambios. Detalle completo en
`docs/tasks/done/DONE-panel-visual-todos-roles.md`.

Efecto secundario: se extrajo `StatCard` (antes duplicado en
`admin/page.tsx` y `mi-cuenta/page.tsx`) a
`apps/web/components/stat-card.tsx`, y se agregó
`TICKET_STATUS_LABEL_STAFF` en `@/lib/ticket-status` porque el label
compartido para `waiting_customer` está redactado desde la
perspectiva del cliente y confundiría en vistas de staff.

## 2026-08-16 — Carrito drawer (mini-cart)

Nuevo carrito tipo drawer que se superpone sobre cualquier página,
inspirado en un mockup de Stitch que trajo el usuario pero traducido a
los tokens reales del sistema de diseño (no la paleta/tipografía del
mockup). El ícono del carrito en el navbar ahora abre el drawer en vez
de navegar a `/carrito` (que sigue existiendo, sin cambios, como
página completa). Reutiliza toda la lógica de negocio real
(`splitCartByThreshold`, precio congelado, umbral configurable) — cero
duplicación de reglas de negocio. Se omitió deliberadamente la barra
de "envío gratis" del mockup: no es una feature real del proyecto (sin
`settings`, sin lógica), mismo criterio de honestidad de contenido ya
aplicado en el navbar. Detalle completo en
`docs/tasks/done/DONE-carrito-drawer.md`.

**Bug real encontrado y corregido de paso:** el badge de conteo del
navbar consultaba `carts` por `profile_id`, pero el carrito es por
empresa (`company_id`) — si otro compañero de la empresa fue quien
creó el carrito, el badge mostraba 0 aunque hubiera ítems.

**Bug real encontrado y corregido durante el build:** importar
`formatCop` de `@tecni/shared` en el nuevo `CartDrawer` (Client
Component) rompía toda la app ("Algo salió mal") — ese paquete valida
variables de entorno de servidor como side-effect al importarse, y el
barrel re-exporta esa validación junto con `formatCop`. Se usa un
`formatCop` local en el componente, mismo patrón que ya tenía
`roi-calculator.tsx` para el mismo problema.

## 2026-08-17 — Corazón de favorito recortado en la tarjeta de producto

Bug visual real: el ícono de favorito (`FavoriteButton`, círculo de
44px) en `ProductCard` (`packages/ui`) se posicionaba a `right-2
top-2` (8px) — exactamente igual al radio de esquina de la tarjeta
(`rounded-lg`, 8px), así que el `overflow-hidden` del `article`
recortaba la parte superior del círculo contra el borde curvo,
dejándolo con forma de semicírculo en vez de círculo completo. Se
corrige aumentando el offset a `right-3 top-3` (12px), suficiente
margen para que el círculo quede fuera del área que recorta la
esquina redondeada.

De paso: se probó y se revirtió un botón "Agregar al carrito" directo
en las tarjetas de producto (commit `0673066`, revertido en
`d2ab0b6`) — el usuario lo pidió inicialmente pero, ya viéndolo
implementado, decidió que se veía desordenado y separado de la
tarjeta. `ProductCard`, las 4 páginas que la consumen y
`carrito/actions.ts` quedan exactamente como estaban antes de esa
tarea.

## 2026-08-17 — "Agregar al carrito" de la ficha de producto abre el drawer

Los tres botones "Agregar al carrito" del sitio (ficha de producto,
barra sticky, calculadora de rentabilidad) usaban un `<form>` que
redirigía a `/carrito` — el cliente quería seguir viendo la misma
página mientras sigue buscando productos. Nueva
`quickAddToCartAction` (sin `redirect`, mismo patrón que las
mutaciones del drawer) reemplaza el `<form action={addToCartAction}>`
en los tres lugares; `AddToCartButton` pasa a ser cliente y abre el
carrito drawer como confirmación en vez de navegar.

## 2026-08-17 — Fotos y firma de conformidad al completar mantenimiento

El técnico ahora sube fotos de evidencia (opcionales) y captura la
firma de conformidad de quien recibe el trabajo (obligatoria) al
completar un mantenimiento — nuevo `SignaturePad` (canvas nativo, sin
librería) y subida a R2 con el mismo patrón que ya usan las fotos de
producto. El esquema ya tenía las columnas (`attachments`,
`customer_signature_r2_key`) sin usar desde que se documentó "sin R2
todavía" — R2 está conectado hace varias tareas, esto solo activa lo
que ya estaba previsto, sin migración.

El cliente ahora ve ese historial completo (texto, fotos, firma) en
`/mi-cuenta/equipos/[id]` y `/mi-cuenta/mantenimientos` — antes no se
mostraba en ningún lado, aunque el reporte ya se guardaba. Helper
compartido `get-maintenance-history.ts` evita duplicar el query entre
las dos páginas. Detalle completo en
`docs/tasks/done/DONE-mantenimiento-fotos-firma.md`.

**Limitación de verificación:** la subida real a R2 no se pudo probar
end-to-end en local — las credenciales R2 están enmascaradas en el
entorno local por diseño (`[SENSITIVE]`). Se confirmó que el código
falla limpiamente en el límite externo esperado sin corromper datos,
y se verificó la parte visual (historial del cliente) insertando un
reporte de prueba vía SQL con URLs reales de R2. Recomendado probar
el flujo de subida completo en producción tras el deploy.

## 2026-08-17 — Calendario en el panel del técnico

Nueva sección `/tecnico/calendario`: cuadrícula de mes con los
mantenimientos programados del técnico (pendientes en naranja,
completados en verde), navegación anterior/hoy/siguiente. Solo
mantenimientos — los tickets de soporte no tienen fecha programada,
confirmado antes de excluirlos.

Corrección real de zona horaria en el camino: las fechas se agrupan
usando la hora de Bogotá (`America/Bogota`), no UTC crudo — un
`scheduled_at` cerca de medianoche podía caer en el día equivocado si
se usaba `.toISOString().slice(0,10)` directo. Verificado con un caso
de prueba real cruzando ese límite (`02:00 UTC` = `21:00` Bogotá del
día anterior) antes de confirmar el fix. Detalle:
`docs/tasks/done/DONE-calendario-tecnico.md`.

## 2026-08-21 — Página de alianza comercial Tecnisas × Bitafly

Nueva página pública `/tecnisas-bitafly-aliados-estrategicos`
documentando la alianza real con Bitafly (plataforma de gestión
aeronáutica para drones, RAC 100): Bitafly construyó el sitio de
Tecnisas, y hay descuento cruzado en su plataforma/drones para
clientes de Tecnisas. Contenido original basado en datos reales de
bitafly.com (nunca copiado), SEO completo (OG/Twitter, JSON-LD
`Organization` con `sameAs` a LinkedIn/Instagram reales), en el
sitemap, y con un enlace discreto en el footer legal — sin
protagonismo en el navbar principal, por pedido explícito del
usuario.

**Nota:** la primera versión de este pedido buscaba enlaces ocultos
para manipular el SEO de bitafly.com desde este sitio (cloaking) —
se rechazó por violar las políticas de Google y ser engañoso para
los visitantes. Esta versión final es contenido honesto y visible
sobre una alianza real. Detalle:
`docs/tasks/done/DONE-alianza-bitafly.md`.

## 2026-08-27 — Especificaciones estandarizadas de Desmontadoras + accesorios disponibles

Dos migraciones sobre `attribute_definitions` de la categoría
Desmontadoras: 4 definiciones existentes renombradas en el lugar
(`potencia_motor`→"Poder", `diametro_maximo`→"Diámetro máximo rueda",
`peso`→"Peso neto", `nivel_ruido` confirmado) y 4 nuevas creadas
("Diámetro (interior)", "Diámetro (externo)", "Voltaje de motor",
"Tamaño del paquete") — los 8 campos pedidos por el usuario, todos
opcionales. Como `product_attributes` referencia por `id` y no por
`key`, el renombrado no perdió ningún valor cargado (verificado en los
3 productos existentes: TECNI-301, TECNI-302, TECNIMAX-302). Las 7
definiciones legacy no solicitadas quedan intactas.

Nueva tabla `product_accessories` (clon 1:1 de `product_benefits`:
misma RLS, lectura pública vía `public_products`, escritura solo
`master`) para listar accesorios disponibles por producto — sección
"Accesorios (opcional)" en `/admin/productos/[id]` y render
condicional en la ficha pública. El enlace de video de YouTube/Vimeo
ya existía (`products.video_url`), no requirió cambios.
Detalle: `docs/tasks/done/DONE-specs-accesorios-desmontadoras.md`.

## 2026-08-27 — Foto por accesorio + corrige bloqueo al eliminar categorías

`product_accessories.image_url` — una foto opcional por accesorio,
mismo patrón de subida/reemplazo/borrado a R2 que
`categories.image_url` (`buildAccessoryAssetKey`), visible en el admin
y en la ficha pública.

**Bug corregido:** `deleteCategory` fallaba con "todavía tiene
productos... asociadas" aunque el usuario ya hubiera eliminado esos
productos desde el panel — `deleteProduct` es borrado lógico
(`deleted_at`), así que la fila seguía existiendo y bloqueando la FK
de `categories`, sin que el usuario pudiera verlo en ningún listado.
Ahora `deleteCategory` distingue: si el bloqueo es por productos
**activos** o promociones, sigue exigiendo moverlos primero (mensaje
más preciso); si es solo por productos ya eliminados (historial), la
categoría se desactiva (`is_active = false`) en vez de fallar —
desaparece del catálogo igual que un `DELETE` real, sin perder el
historial de esos productos. Nuevo mensaje de aviso distinto
("deactivated=1") en `/admin/categorias` para este caso.

## 2026-08-28 — Nueva categoría Balanceadoras con 12 especificaciones

Categoría "Balanceadoras" separada de "Alineación" (antes mezcladas
en `alineacion-balanceo`), con sus 12 specs propias (Poder, Velocidad
de balanceo, Precisión de balanceo, Diámetro del rin, Ancho del rin,
Peso de la llanta, Tiempo de ciclo, Ruido, Peso neto, Temperatura de
trabajo, Tamaño del empaque, Voltaje), todas opcionales. Confirmado
con el usuario antes de migrar: separar en vez de mezclar con las
specs de alineadoras existentes. La sección de Accesorios (informativa,
con foto) ya funciona para cualquier producto sin cambios — no hacía
falta nada nuevo para "accesorios de compra opcional" en esta
categoría. Detalle: `docs/tasks/done/DONE-categoria-balanceadoras.md`.

## 2026-08-28 — Quita specs legacy de Desmontadoras

A pedido explícito del usuario, se eliminaron las 7
`attribute_definitions` legacy de Desmontadoras que se habían dejado
intactas al estandarizar las 8 specs (Sujeción externa, Sujeción
interna, Ancho máximo, Presión de trabajo, Alimentación, Brazo
oscilante, Inflado de talón) — no estaban en la lista de 8 campos
pedida originalmente. `product_attributes.definition_id` tiene
`on delete cascade`, así que los valores cargados en TECNI-301/302 y
TECNIMAX-302 para esos campos se borraron junto con la definición
(efecto esperado). La categoría queda solo con las 8 specs
estandarizadas.

## 2026-08-28 — SKU editable (caso real: cambia el código en Siigo)

`updateProductSku` — el SKU ahora se puede corregir desde
`/admin/productos/[id]#peligro` (antes era inmutable por diseño, para
proteger el vínculo de sincronización de precio con Siigo). Se separó
del formulario normal de contenido, con su propia confirmación
explicando el riesgo (el producto queda sin precio hasta que el código
coincida en ambos lados), y queda registrado en `audit_log`
(`product.sku_changed`, con el SKU anterior y el nuevo) vía
`service_role`, mismo patrón que `changeUserRole`.

## 2026-08-28 — Corrige eliminar marcas (mismo bug que categorías)

`deleteBrand` tenía el mismo bug corregido antes en `deleteCategory`:
`deleteProduct` es borrado lógico, así que un producto "eliminado"
seguía bloqueando el `DELETE` de su marca por la FK
(`products_brand_id_fkey`), aunque no apareciera en ningún listado —
confirmado con datos reales: Bosch, Corghi, Hofmann, Launch y Snap-on
tenían 0 productos activos pero fallaban al eliminar. Mismo criterio
ahora en ambas: si el bloqueo es solo por productos ya eliminados
(historial), la marca/categoría se desactiva en vez de fallar.

## 2026-08-29 — 8 productos nuevos + categorías Inspector de Llantas y Rectificadora de Rines

Cargadas 8 fichas técnicas reales que compartió el usuario: 4
Balanceadoras (TECNI-U579, T115, 7050, 7020, con las 12 specs ya
estandarizadas), 2 Inspector de llantas (TECNI-PL-S275, PL-S825,
categoría nueva) y 2 Rectificadora de rines (TECNI 1 Puesto / Con
Motor, categoría nueva). Accesorios opcionales cargados para las 4
Balanceadoras (conos céntricos rin 17.5, adaptador de moto). Quedaron
como borrador (`is_active=false`): no se pudo subir la foto de
producto porque las credenciales de R2 en este entorno son un
placeholder y no existen todavía en Vercel — mismo límite ya
documentado antes. Fotos recortadas y enviadas al usuario para que
las suba manualmente y publique. Detalle:
`docs/tasks/done/DONE-carga-balanceadoras-inspector-rectificadora.md`.
