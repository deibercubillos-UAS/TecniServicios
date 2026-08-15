# Changelog (parte B: Fase 4 en adelante)

Parte A (2026-08-07 a Fase 3): [`CHANGELOG.md`](./CHANGELOG.md)

---

## 2026-08-09 — Rediseño v2 del home

Rediseño completo de `apps/web/app/(public)/page.tsx` (v1 rechazado por
el usuario): hero-carrusel real (`banners` placement `home_hero`,
múltiples filas por `position`, componente cliente `hero-carousel.tsx`
con autoplay pausable, controles visibles, `prefers-reduced-motion`),
sección "Servicios ofrecidos" (los 4 módulos reales de la plataforma),
"Explora por categoría" (sin cambios de datos), "Lo más vendido"
(**decisión del usuario**: no se agrega desde `order_items` — RLS de
pedidos es por empresa, nunca público — el master selecciona
manualmente qué productos aparecen ahí; columna nueva `is_bestseller`
en `products`, expuesta en `public_products`, editable solo por
`products_write_master`), promoción activa, teaser de "Calcula tu
rentabilidad", explicación del proceso de cotización, y JSON-LD
`Organization` para SEO. Segunda excepción real del proyecto a "Server
Components por defecto": `hero-carousel.tsx` (la primera fue
`roi-calculator.tsx`).

Migración `20260809310000_add_is_bestseller_to_products.sql` aplicada
directo sobre el proyecto real vía `execute_sql`/`apply_migration`
(mismo patrón que el resto de Fase 4-6). 4 productos demo marcados
`is_bestseller = true` para verificación visual.

## 2026-08-09 — Fase 4: postventa

**Esquema y RLS:** las 5 tablas de postventa (`owned_equipment`,
`maintenance_requests`, `maintenance_reports`, `support_tickets`,
`ticket_messages`), todas con RLS probada con empresas, vendedores y
técnicos reales. Hallazgo real corregido: `owned_equipment_read` y
`maintenance_insert_owner` se referenciaban entre sí y producían
`infinite recursion detected in policy` — corregido con una función
`security definer` (`auth_assigned_equipment_ids()`), mismo patrón que
`auth_company_ids()`/`auth_role()`. Otro hallazgo del `get_advisors` de
cierre: esa función nueva quedó ejecutable por `anon` (el primer intento
de revocar el permiso no bastó, había que revocar de `PUBLIC`, no de
`anon` directo) — corregido y verificado.

**Equipo adquirido:** `markOrderDelivered()` marca el pedido entregado y
genera un `owned_equipment` por unidad de cada producto serializado —
mismo patrón de dos clientes que `acceptQuote` de la Fase 3 (sesión de
staff + `service_role` solo para la creación que RLS no permite
directo). Registrado en `audit_log` (única función de esta fase que
toca "pedido"). Botón "Marcar como entregado" en `/ventas/pedidos`.

**Equipos y manuales:** `/mi-cuenta/equipos` — lista y detalle, manual
"pendiente de sincronización" en vez de un enlace fabricado (sin R2
real todavía, mismo criterio que la factura de Fase 3).

**Mantenimiento:** el cliente agenda sobre un equipo propio
(`/mi-cuenta/mantenimientos`); el técnico confirma, reprograma y reporta
al completar desde `/tecnico/mantenimientos` — **primer uso real del
prefijo `/tecnico`**, protegido por el middleware desde la Fase 1 sin
contenido hasta ahora. Un técnico ajeno a una solicitud queda bloqueado
en cada paso, verificado con datos reales.

**Tickets de soporte:** el cliente abre y responde su propio ticket,
siempre sin poder marcar un mensaje como interno (el `with check` de RLS
lo exige, no depende de que el formulario "decida" bien). El staff
(`/tecnico/tickets`) ve todo, responde al cliente y agrega notas
internas por separado — verificado real que el cliente **nunca** ve una
nota interna, ni en el conteo, ni antes ni después de que el ticket se
resuelva o cierre. `seller` tiene lectura pero no puede cambiar estado,
exacto a la matriz de `06-AUTH-ROLES.md`.

**Checklist de seguridad de cierre (paso 8.1):** sin hallazgos nuevos
esta vez — a diferencia del cierre de Fase 3, donde el mismo checklist
encontró dos defectos reales (`audit_log` faltante y un doc escrito
tarde).

**Pendiente, no bloquea el cierre:** panel de asignación de técnico
(se asigna desde `/ventas` o vía SQL, sin UI dedicada); panel de
vendedor completo (clientes, agenda de visitas) — estaba en el objetivo
original de la fase, no se construyó; `11-STORAGE-R2.md` sigue sin
escribir (sin código de R2 todavía que documentar); mismas deudas
técnicas heredadas de Fase 3 (`registerUser` sin `audit_log`, sin Zod).
`docs/21-ROADMAP.md` actualizado: Fase 4 ✅ Listo.

## 2026-08-09 — Fase 5: panel maestro y contenido

**Esquema y RLS:** `posts`, `banners`, `promotions` nuevas — mismo
patrón de visibilidad los tres (público ve solo lo activo/publicado/
vigente, `master` ve y escribe todo). `settings` abrió su primera
política de escritura real (`settings_master`, antes bloqueada por
completo desde la Fase 1) con un hallazgo de limpieza real: la primera
prueba dejó `updated_by` de `settings` apuntando a un perfil de prueba
y el `delete` posterior violó la FK — corregido reseteando `updated_by`
antes de borrar los perfiles. Dos migraciones nuevas para
`/admin/usuarios`: `change_user_role()` (función `security definer`,
mismo patrón que `auth_company_ids()`/`is_master()`, necesaria porque
`profiles_update_self` bloquea que cualquiera —incluido `master`—
edite el `role` de otro por update directo) y
`company_members_write_master`.

**Catálogo:** `/admin/productos`, `/admin/categorias`, `/admin/marcas`
— CRUD de contenido, `createProduct`/`updateProduct` excluyen
explícitamente `price_cop`/`stock_status` del payload (regla de
negocio 5.3 de `CLAUDE.md`: Siigo manda en precio, la web manda en
catálogo). `sku`/`slug` no editables tras crear un producto — clave de
sincronización con Siigo y enlaces ya indexados. Sin editor de
atributos dinámicos por categoría — reclasificado a pendiente sin fase
asignada.

**Contenido:** `/admin/banners` (vigencia, `placement` como whitelist
en código, sin enum en el esquema) y `/admin/promociones` (alcance
producto o categoría — **exactamente uno**, validado en código, ni
`check` en el esquema; `discountType` también whitelist) siguen el
mismo patrón. `/admin/blog` separa contenido de publicación:
`createPost`/`updatePost` nunca tocan `is_published`,
`publishPost`/`unpublishPost` son las únicas dos funciones que pueden
— con soporte de programación (`published_at` futuro).

**Configuración:** `/admin/configuracion` — genérica sobre cualquier
`key` de `settings` (hoy solo `quote_threshold_cop`, la regla de
negocio 5.2 de `CLAUDE.md` exige que sea editable acá, nunca
hardcodeado), valor editado como JSON crudo.

**Usuarios:** `/admin/usuarios` — cambio de rol de plataforma (vía
`change_user_role()`) y de rol interno por empresa
(`company_members_write_master`), **ambos auditados desde el primer
uso** — corrige la deuda técnica descubierta en el cierre de la Fase 3
(`registerUser` nunca auditó un cambio de rol). Verificado real que ni
`customer` ni `seller` pueden auto-escalarse ni cambiar el rol de
otro, ni por el RPC ni por `update` directo sobre `profiles`.

**Auditoría y métricas:** `/admin/auditoria` — visor de `audit_log`
(RLS ya existente desde la Fase 1, solo lectura, solo `master`) con
filtros por entidad/actor/fecha; verificado real que ni siquiera
`master` puede editar o borrar una fila (inmutable). Hallazgo de la
propia prueba, no del código: un primer intento de verificar esa
inmutabilidad daba positivo siempre porque un `update` sin política
aplicable no lanza error, solo afecta 0 filas en silencio — corregido
re-consultando el valor después de la operación en vez de solo
capturar excepciones. `/admin/metricas` — conteos reales (pedidos por
estado, cotizaciones abiertas, tickets abiertos, mantenimientos
pendientes), sin gráficas fabricadas.

**Checklist de seguridad de cierre (paso 8.1):** sin hallazgos nuevos
— las ocho preguntas de `05-RLS-SECURITY-B.md` y las tres de
`CLAUDE.md` revisadas contra los siete pasos de la fase; la falta de
Zod sigue siendo deuda técnica preexistente del proyecto completo, no
algo que esta fase haya empeorado.

**Pendiente, no bloquea el cierre:** editor de atributos dinámicos por
categoría; subida real de imágenes/manuales (depende de
`11-STORAGE-R2.md`, sin empezar); aplicar el descuento de una
promoción al precio real (`PENDIENTE-DECISIÓN`, se muestra pero no
toca `resolvePrice()`); mismas deudas heredadas del resto del proyecto
(sin Zod, dominio/Siigo/Wompi/inventario reales pendientes).
`docs/21-ROADMAP.md` actualizado: Fase 5 ✅ Listo.

## 2026-08-09 — Fase 6: endurecimiento (parcial — bloqueada en un punto)

**Auditoría de seguridad y rendimiento:** `get_advisors` (seguridad)
sobre todo el proyecto por primera vez de punta a punta — 6 hallazgos,
todos ya aceptados en fases previas, cero nuevos. `get_advisors`
(rendimiento): 34 foreign keys sin índice corregidas con una
migración; `auth_rls_initplan` (14 políticas) y
`multiple_permissive_policies` (15) documentados como deuda técnica,
tocan RLS de ~15 tablas, fuera de alcance de un solo paso. Cabeceras
de seguridad (CSP, HSTS, X-Frame-Options, etc.) agregadas en
`next.config.ts` — no existía ninguna antes.

**Hallazgo real y corregido en el camino:** `pnpm build` estaba roto
desde antes de esta fase (`ORDER_STATUS_LABEL` exportado desde un
`page.tsx`, inválido en App Router) — bloqueaba verificar cabeceras y
Core Web Vitals con un build real. Corregido moviendo la constante a
`lib/order-status.ts`.

**Rendimiento y accesibilidad:** auditoría de Core Web Vitals limitada
a revisión estática de código (sandbox sin credenciales reales de
Supabase, ninguna página renderiza completa) — cero `"use client"` en
todo el proyecto, `next/font` autoalojada, hallazgo real sin corregir
(`<img>` en vez de `next/image`, depende de R2). Checklist de
accesibilidad WCAG 2.1 AA nuevo en `02-DESIGN-SYSTEM.md`, aplicado:
landmark `<main>` agregado al layout raíz, `role="alert"` en 27
mensajes de error de formulario.

**Ley 1581 y textos legales:** `docs/20-COMPLIANCE.md` nuevo. Flujo
real de supresión de datos: `/mi-cuenta/privacidad` (solicitud, vía
`contact_messages`) + `anonymizeProfile`/botón en `/admin/usuarios`
(ejecución por `master`, audita `profile.anonymized`, conserva
`orders`/`payments`/`quotes` intactos por obligación fiscal).
Verificado real que un `customer` ajeno no puede tocar el perfil de
otro. Cuatro páginas legales públicas (política de tratamiento,
términos, garantía, envíos y devoluciones) — contenido grounded en lo
que la plataforma ya hace, marcado explícitamente como borrador sujeto
a revisión legal.

**Monitoreo y respaldos:** integración de monitoreo de errores lista
(`NEXT_PUBLIC_ERROR_TRACKING_DSN` opcional, `lib/error-tracking.ts`,
`global-error.tsx` — única excepción del proyecto a "Server Components
por defecto", exigida por Next.js) sin proveedor contratado.
**Hallazgo real y bloqueo explícito:** el proyecto Supabase real está
en plan Free — sin respaldos automáticos diarios, y crear una rama de
prueba para probar una restauración cuesta dinero real (~$0.01344/hora
confirmado con `get_cost`). Se presentó la disyuntiva al usuario, que
eligió no autorizar el gasto por ahora — el paso 6.3 (probar
restauración real) queda bloqueado y sin ejecutar.

**Checklist de seguridad final (paso 7.1):** sin hallazgos nuevos.

**Cierre:** `docs/21-ROADMAP.md` actualizado — Fase 6 marcada 🟡
Parcial (no ✅ Listo: el criterio de "listo" del roadmap exige la
restauración probada con éxito, que sigue bloqueada). Tabla de estado
del roadmap corregida de paso: llevaba desde la Fase 3 sin actualizar,
marcaba "2–7 Pendiente" con las Fases 2–5 ya completas hace tiempo.

## 2026-08-09 — Incidente real: CSP dejó producción en blanco

**Qué pasó:** la CSP agregada en el paso 2.3 de la Fase 6
(`next.config.ts`, `script-src 'self'` sin `unsafe-inline` ni nonce)
bloqueaba los scripts inline que Next.js inyecta al hidratar cada
página en el navegador — el usuario reportó la producción real en
blanco tras cargar. Confirmado con la consola del navegador: errores
`Executing inline script violates ... 'script-src 'self''` repetidos,
uno por cada script de hidratación.

**Por qué pasó:** `next.config.ts` solo puede emitir cabeceras
estáticas en build — no puede generar un nonce distinto por request,
que es lo que Next.js necesita para permitir sus propios scripts
inline sin abrir la puerta a cualquier script inyectado (`unsafe-inline`
habría sido la salida fácil pero mucho más débil). El paso 2.3 nunca
lo probó contra un `pnpm build`/deploy real con hidratación en el
navegador — solo `curl -I` contra `pnpm dev`, que confirma que la
cabecera existe pero no que el sitio hidrate sin romperse.

**Corrección:** la CSP se movió de `next.config.ts` a `middleware.ts`,
con un nonce generado por request (`crypto.randomUUID()`) y
`script-src 'self' 'nonce-{nonce}' 'strict-dynamic'` — el patrón oficial
de Next.js para App Router. El matcher del middleware se amplió de las
rutas protegidas a prácticamente todo el sitio (excluye solo estáticos)
para que la cabecera se aplique de verdad en toda página, no solo en
`/admin`/`/mi-cuenta`/etc. `global-error.tsx` también se corrigió: al
reemplazar el `<html>` completo no importaba `globals.css`, así que
si alguna vez se activaba se veía sin estilos.

**Lección para la próxima vez que se toque una cabecera dependiente de
request (CSP con nonce, o cualquier cosa que no pueda ser 100% estática):
verificar con un build real y, si es posible, contra un deploy de
Vercel — no basta con `pnpm dev` local.**

## 2026-08-10

**Disponibilidad real para agendar mantenimiento**

- `maintenance_availability` (migración + RLS: lectura cualquier autenticado,
  escritura solo master) — fechas que master abre, con cupo (`max_visits`).
- `packages/core`: `createMaintenanceAvailability`, `deleteMaintenanceAvailability`;
  `requestMaintenance` valida server-side que la fecha preferida esté abierta y
  con cupo (nunca confía solo en el `<select>` del cliente).
- `/admin/mantenimientos`: master abre/cierra fechas, ve cupo usado en tiempo real.
- `/mi-cuenta/mantenimientos` y `/mi-cuenta/tickets`: el campo de fecha libre
  pasa a `<select>` con las fechas realmente abiertas y su cupo restante.

## 2026-08-10 (2)

**Productos — imágenes múltiples, fichas técnicas y carga masiva desde Excel**

- `product_documents` tenía RLS habilitada sin ninguna política (bug preexistente
  que bloqueaba lectura y escritura por completo) — corregido: público si
  `is_public`, dueño del equipo si es manual privado, master escribe.
- `packages/integrations/src/r2`: cliente R2 real (S3-compatible), sube/borra
  objetos. `docs/11-STORAGE-R2.md` documenta cómo se generan las keys.
- `/admin/productos/[id]`: subir varias imágenes a la vez, marcar principal,
  eliminar; subir fichas técnicas (públicas) o manuales (privados), eliminar.
- Catálogo público: la pestaña "Especificaciones técnicas" muestra ahora las
  fichas técnicas subidas, con enlace de descarga real.
- `/admin/productos/importar`: carga masiva desde el Excel de Siigo con mapeo
  de columnas configurable (nunca asume nombres de columna fijos), crea o
  actualiza por SKU, nunca toca precio ni stock, reporta creados/actualizados/
  errores por fila.

## 2026-08-11

**Mejoras de frontend — benchmark es.hunter.com**

- Auditado es.hunter.com (líder de mercado del segmento) como referencia
  visual; hallazgos documentados en `docs/02-DESIGN-SYSTEM.md` §4.
- `categories.image_url` (migración), subida/borrado de foto a R2 desde
  `/admin/categorias/[id]`. `CategoryHeroCard` (`packages/ui`): foto
  full-bleed con overlay degradado, conectada en la home con fallback a
  la card de ícono existente cuando la categoría no tiene foto — sin
  fotos de stock inventadas.
- `StickyProductCta`: barra fija de CTA en la ficha de producto, visible
  al pasar la caja de compra principal. Replica exacto los 3 estados de
  `resolvePrice`/sesión — el umbral de cotización no se evalúa en la
  ficha (solo en el carrito), corrección sobre el spec inicial. Se
  oculta si `CompareBar` está visible para no superponerse.
- `CatalogMegaMenu` evaluado y descartado: 6 categorías activas, todas
  de primer nivel — el dropdown simple actual sigue siendo lo correcto.
  Ver `docs/tasks/done/DONE-mejoras-frontend-hunter.md`.

## 2026-08-15

**Panel maestro — banners, blog, promociones, mantenimientos, usuarios,
configuración, métricas y auditoría**

- **Bug real corregido:** `updateBrand` sobrescribía `logo_url` a `null`
  en cada "Guardar cambios" que no tocara el logo — el patch de update
  ahora solo incluye una columna cuando el input la trae explícitamente
  (patrón defensivo aplicable a cualquier update parcial futuro).
- **Banners:** enlace como desplegable (páginas reales + categorías +
  "Otro"); lista agrupada por ubicación (`home_hero`/`catalog_top`/
  `announcement_bar`/`promotions`); `announcement_bar` deja de pedir
  imagen y usa uno de 5 íconos fijos en su lugar (migración: `image_url`
  nullable, columna `icon` nueva).
- **Promociones:** aviso cruzado con "Banners → Sección de descuentos"
  (complementarios, no duplicados — se evaluó fusionarlos y se descartó).
  Frontend de crear/editar rediseñado: alcance producto/categoría
  deshabilita el select no elegido, vista previa en vivo del descuento.
- **Blog:** slug automático del título (ya no lo pide el formulario, no
  editable después de creado); portada con vista previa en vivo de la
  URL pegada; publicar/despublicar con confirmación.
- **Mantenimientos — disponibilidad:** técnico y ciudad/departamento
  como metadatos por fecha (desplegable dependiente con datos reales de
  Colombia, `apps/web/lib/colombia-geo.ts`); generación masiva por rango
  de fechas × varios técnicos en un solo envío (migración: `id` propio
  como llave, único por fecha+técnico, ya no una fila por fecha);
  calendario del mes de solo lectura al final de la página.
- **Usuarios:** separado en dos pestañas/rutas reales — Equipo
  (vendedor/técnico/master, leído directo de `profiles`, corrige un bug
  donde el staff sin empresa era invisible) y Clientes (agrupado por
  empresa, como antes). Tablas compactas con Editar/Eliminar en vez de
  formularios inline; "Anonimizar" renombrado a "Eliminar" con
  confirmación (misma función Ley 1581 de siempre, nunca borra
  historial).
- **Configuración:** deja de editarse como JSON crudo — agrupada en 4
  secciones con label en español y el tipo de input correcto
  (`apps/web/lib/settings-config.ts` como única fuente de verdad).
- **Métricas:** reconstruida — lógica movida a `packages/core`
  (`getDashboardMetrics`, con pruebas), filtros reales por fecha/
  vendedor/departamento/ciudad vía query params, KPIs de negocio
  (ingresos, ticket promedio, conversión de cotizaciones) en vez de
  solo conteos, desglose por estado con barras.
- **Auditoría:** filtros de entidad/acción/actor como desplegables en
  español (antes texto libre o pegar un UUID), paginación real (50 por
  página), `before`/`after` en un detalle expandible con JSON
  formateado.
- Documentación actualizada en el mismo alcance: `16-ADMIN-MASTER.md`
  (reescrito), `14-MODULE-SERVICE.md` §4, `15-MODULE-CONTENT.md` §3/§6,
  `04-DATABASE-SCHEMA-B.md` (`banners.icon`, `maintenance_availability`
  documentada por primera vez — existía en producción sin estar en el
  esquema documentado).
