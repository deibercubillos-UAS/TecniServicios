# 16 — Panel maestro

Volver a [`00-INDEX.md`](./00-INDEX.md) · Contenido en
[`15-MODULE-CONTENT.md`](./15-MODULE-CONTENT.md) · Roles en
[`06-AUTH-ROLES.md`](./06-AUTH-ROLES.md) · RLS en
[`05-RLS-SECURITY-A.md`](./05-RLS-SECURITY-A.md) +
[`05-RLS-SECURITY-C.md`](./05-RLS-SECURITY-C.md)

---

## 1. Por qué existe

`master` es el único rol que opera el sitio sin desarrollador
(`21-ROADMAP.md` Fase 5). Todo lo que este documento describe vive bajo el
prefijo `/admin`, ya protegido por el middleware desde la Fase 1
(`06-AUTH-ROLES.md` sección 5, `{ prefix: "/admin", roles: ["master"] }`) —
esta fase construye el contenido de esas rutas, no el guardado de acceso,
que ya existe.

**Tres capas, igual que el resto del proyecto** (`05-RLS-SECURITY-A.md`
sección 1): el middleware decide si `master` puede ver la ruta, RLS decide
qué filas puede tocar. Ninguna pantalla de `/admin` confía en que "solo
`master` llega hasta acá" — cada escritura pasa por una política
`*_write_master`/`is_master()` real, probada con un rol inferior real que
la intenta y falla.

---

## 2. Catálogo (`/admin/productos`, `/admin/categorias`, `/admin/marcas`)

CRUD de contenido, **nunca de precio ni stock** — esos son de Siigo
(regla de negocio 5.3 de `CLAUDE.md`). El formulario de producto no tiene
un campo `price_cop` ni `stock_status` editable; si algún día se necesita
forzar un precio manual, es una decisión de negocio aparte
(`PENDIENTE-DECISIÓN`), no un descuido de este formulario.

Campos editables: `name`, `short_description`, `description`,
`category_id`, `brand_id`, `is_active`, `is_featured`, `is_bestseller`
(curaduría manual de "lo más vendido" del home — nunca un ranking
automático de `order_items`, que no es públicamente legible por RLS),
`warranty_months`, especificaciones técnicas (`product_attributes`) y
fotos reales subidas a R2 (`docs/11-STORAGE-R2.md`) — cada producto
puede tener varias, una marcada `is_primary` (grid/ficha/carrito) y
otra marcada `is_hero` (hero de categoría), independientes entre sí; la
primera foto subida queda marcada con ambas por defecto. La página de
edición del producto agrupa Imágenes/Especificaciones/Video/Beneficios/
Manual como secciones plegables (`<details>`, sin JavaScript) con un
resumen de estado en el título, para no obligar a scroll largo.

`categories`/`brands`: CRUD simple (`name`, `slug`, `is_active`).
`/admin/categorias` lista las categorías en el orden real del sitio
(`position`) con flechas ▲/▼ por fila para reordenarlas
(`moveCategory` en `packages/core`, intercambia `position` con el
vecino adyacente) — ese orden se refleja en el navbar, `/catalogo` y
cada página de categoría.

---

## 3. Contenido (`/admin/banners`, `/admin/blog`, `/admin/promociones`)

Documentado en detalle en `15-MODULE-CONTENT.md`. El panel es el único
lugar donde se escribe en `posts`/`banners`/`promotions` — no hay otra
vía (ni Server Action pública, ni `service_role` desde un webhook).

`/admin/banners` agrupa por ubicación (`home_hero`, `catalog_top`,
`announcement_bar`, `promotions`, `category_hero`), una sección por
placement con su propio "+ Nuevo" preseleccionado. `announcement_bar`
no sube imagen — el formulario oculta el campo y en su lugar el master
elige uno de 5 íconos fijos (`apps/web/lib/announcement-icons.ts`). El
campo "Enlace" de cualquier banner es un desplegable (páginas del sitio
+ categorías reales + "Otro" para URL libre), no texto suelto —
**excepto `home_hero`**: ahí "Datos básicos" se reduce a solo el
checkbox Activo (título/enlace/ubicación/posición/vigencia dejaron de
ser necesarios), y en su lugar cada banner de ese placement trae un
`<details>` "Texto del hero" para editar el badge, título en 2 líneas,
descripción y 2 botones opcionales del panel de texto del home — un
único dato compartido por todas las fotos, no por banner (detalle en
`15-MODULE-CONTENT.md` sección 3.1).

El sidebar del panel (compartido por master/vendedor/técnico/cliente)
permite colapsar cada grupo con etiqueta por separado con un clic en su
título, persistido en `localStorage` — útil acá porque master ya
acumula varios grupos con muchos ítems.

`/admin/promociones` (descuento real: producto/categoría, valor,
vigencia) y la sección "Sección de descuentos" de banners (solo imagen
de fondo) son complementarios, no duplicados — cada pestaña tiene un
aviso con enlace a la otra explicando qué controla cada una.

`/admin/blog`: el slug se genera automático del título (mismo criterio
que productos/categorías/marcas) — nunca lo pide el formulario, y en
edición se muestra solo como referencia, no editable (cambiarlo rompe
enlaces compartidos). La portada es una URL pegada (sin subida a R2
para posts) con vista previa en vivo.

---

## 4. Configuración (`/admin/configuracion`)

Edita `settings` — `quote_threshold_cop` (regla de negocio 5.2 de
`CLAUDE.md`) y 10 claves más de contacto (`contact_*`, usadas en
`/contacto`). `settings_write_master` es la única política de escritura;
la lectura pasa por la misma sesión de `master`.

Nunca se edita como JSON crudo: `apps/web/lib/settings-config.ts`
(`SETTINGS_SECTIONS`) es la única fuente de verdad de qué claves
existen, su etiqueta en español, tipo de input (número/teléfono/correo/
URL/texto) y ayuda — la usan tanto la página (pinta el formulario) como
el server action (sabe cómo parsear cada valor de vuelta a JSON). Si se
agrega una clave nueva a `settings` vía migración, se agrega también
acá para que aparezca en el panel.

Cada cambio de `settings` queda en `audit_log` (un cambio de umbral
afecta directamente cuánto paga un cliente en línea vs. cotiza — se
audita por la misma razón que se audita un cambio de precio).

---

## 5. Usuarios y roles (`/admin/usuarios`)

Dos pestañas, dos rutas reales (mismo criterio que el resto del panel,
no tabs client-side):

- **`/admin/usuarios`** ("Equipo"): vendedor/técnico/master, leído
  directo de `profiles.role in (seller, technician, master)` — sin
  pasar por `company_members`, porque el staff normalmente no
  pertenece a una empresa cliente. (Antes de esta corrección, un
  vendedor/técnico/master sin fila en `company_members` era invisible
  en el panel — bug real, corregido.)
- **`/admin/usuarios/clientes`** ("Clientes"): usuarios de empresas
  cliente, agrupados por empresa vía `company_members`, tabla por
  empresa con rol interno + rol de plataforma.

Cada fila tiene solo dos acciones — **Editar** (lleva a
`/admin/usuarios/[id]`, ficha con el cambio de `profiles.role` y, si
aplica, `company_members.member_role`) y **Eliminar** (confirmación,
llama a la misma anonimización Ley 1581 de siempre — nunca borra la
fila ni el historial de pedidos/cotizaciones/auditoría, solo limpia
nombre/teléfono/foto y desactiva el perfil). Todo cambio de rol o
anonimización queda en `audit_log`.

---

## 6. Auditoría (`/admin/auditoria`)

Visor de `audit_log` (política `audit_read_master`, de solo lectura —
nadie edita ni borra una fila). Filtros como desplegables en español
(acción, entidad, quién — poblado con los actores que realmente
aparecen en el log, nunca pidiendo pegar un UUID), rango de fecha,
paginación real (50 por página con conteo total), `before`/`after` en
un detalle expandible con JSON formateado. Sin exportación ni búsqueda
de texto completo — se agrega si hace falta después.

---

## 7. Métricas (`/admin/metricas`)

Lógica en `packages/core` (`getDashboardMetrics`, con pruebas) — la
página nunca calcula directo, solo pinta lo que la función devuelve.
KPIs reales: ingresos (pedidos no cancelados, suma de `total_cop`),
ticket promedio, tasa de conversión de cotizaciones, tickets abiertos,
mantenimientos pendientes, desglose por estado (pedidos, cotizaciones,
tickets, mantenimientos) con barra proporcional. Sin gráficas
fabricadas — cada número sale de una consulta real.

Filtrable por rango de fechas, vendedor, y departamento/ciudad de la
empresa (mismo desplegable departamento→ciudad que mantenimientos,
`apps/web/lib/colombia-geo.ts`) — todo vía query params en la URL, así
que un filtro aplicado es compartible/marcable como favorito.

---

## 8. Mantenimiento — disponibilidad (`/admin/mantenimientos`)

Ver detalle completo en `14-MODULE-SERVICE.md` sección 4. Master abre
cupos por fecha, con técnico y ciudad/departamento como metadatos
informativos (el cupo sigue siendo compartido por fecha, no se parte
por técnico). Dos formas de generar disponibilidad: una fecha a la vez,
o un rango de fechas × varios técnicos de una sola vez (con días de la
semana a incluir). Calendario del mes al final de la página, solo
lectura, para ver de un vistazo qué días ya están cubiertos.

---

## 8.1 Equipos y mantenimiento preventivo (`/admin/equipos`)

Único lugar donde se gestiona `owned_equipment` desde admin. Master fija
`maintenance_interval_months` por equipo (edición inline en la lista) —
null significa sin mantenimiento preventivo configurado, sin
recordatorios. `next_maintenance_due_at` se calcula solo (nunca se
edita a mano): ancla en el último mantenimiento completado o, si aún no
hay ninguno, en la fecha de entrega. Un cron diario
(`/api/cron/maintenance-reminders`, Vercel Cron, protegido con
`CRON_SECRET`) avisa por correo a la empresa 15 días antes del
vencimiento vía Resend (`docs/10-INTEGRATION-RESEND.md`) — detalle
completo del flujo en `14-MODULE-SERVICE.md` sección 4.5.

---

## 9. Fuera de alcance por ahora

- Subida de archivos reales para portadas de blog (sigue siendo una URL
  pegada, sin R2 — a diferencia de banners/categorías/productos, que sí
  suben a R2).
- Aplicar el descuento de una promoción al precio real —
  `PENDIENTE-DECISIÓN` (`15-MODULE-CONTENT.md` sección 4).
- Editor de blog enriquecido (WYSIWYG) — texto/markdown plano.
- Exportar auditoría o métricas a CSV/Excel.
- El flujo de solicitud de mantenimiento del cliente no filtra todavía
  por ciudad/técnico (solo por fecha) — decisión explícita, se deja
  para otra tarea.
