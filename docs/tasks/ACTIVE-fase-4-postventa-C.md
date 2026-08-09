# TAREA: Fase 4 — Postventa (parte C: bitácora continuación, bloqueos, pendientes)

Parte A (plan): [`ACTIVE-fase-4-postventa-A.md`](./ACTIVE-fase-4-postventa-A.md)
Parte B (bitácora, pasos 1.1–3.2): [`ACTIVE-fase-4-postventa-B.md`](./ACTIVE-fase-4-postventa-B.md)

## Bitácora (continuación)

### 2026-08-09 — paso 3.3 (RLS de maintenance_reports)

- **Hecho:** aplicada
  `packages/db/migrations/20260809170000_maintenance_reports_rls_policies.sql`
  — `maintenance_reports_read` (vía `maintenance_requests`, hereda su
  visibilidad: empresa, técnico asignado, vendedor asignado, master),
  `maintenance_reports_insert_tech` (solo el técnico asignado a esa
  solicitud, doble condición: `technician_id = auth.uid()` **y**
  `request_id` de una solicitud donde también es el técnico asignado).
  Sin update/delete: el reporte queda inmutable, mismo criterio que
  `order_items`.
- **Verificación:** real vía `execute_sql`. Un técnico ajeno a la
  solicitud intenta escribir el reporte y choca con
  `insufficient_privilege`; el técnico asignado sí puede; el dueño de
  la empresa lo lee; otra empresa no; un `UPDATE` del propio técnico
  sobre su reporte ya escrito **no afecta ninguna fila** (sin política
  de update, comportamiento correcto de RLS — no lanza excepción, pero
  el valor queda intacto, verificado leyendo `work_done` después);
  `anon` no ve nada. Limpieza completa confirmada con `count(*)`.
- **Archivos:**
  `packages/db/migrations/20260809170000_maintenance_reports_rls_policies.sql`
  (nuevo).
- **Resultado:** verificación OK. Cierra el paso 3.3. Sigue el 3.4
  (`support_tickets`).
- **Commit:** `feat(db): políticas RLS de maintenance_reports — solo el técnico asignado escribe, inmutable`

### 2026-08-09 — paso 3.4 (RLS de support_tickets)

- **Hecho:** aplicada
  `packages/db/migrations/20260809180000_support_tickets_rls_policies.sql`
  — `support_tickets_read` (empresa dueña, o cualquier
  `technician`/`seller`/`master` ve todos los tickets — soporte es un
  rol global, no por empresa asignada), `support_tickets_insert_owner`
  (cliente abre para su propia empresa), `support_tickets_write_staff`
  (**solo `technician`/`master`** — `seller` queda excluido a
  propósito, exacto a la matriz "🔸 lectura" de `06-AUTH-ROLES.md`
  sección 2).
- **Verificación:** real vía `execute_sql`. Cliente A abre su ticket;
  no puede abrir uno a nombre de la empresa B
  (`insufficient_privilege`); empresa B (cliente, no staff) no lo ve;
  técnico y vendedor sí lo ven (comportamiento correcto, no un fallo de
  aislamiento — el soporte es global por diseño); **el vendedor intenta
  asignarse el ticket y no tiene efecto** (0 filas, sin política de
  update para `seller`); el técnico sí puede asignarse y cambiar
  estado; **el propio cliente tampoco puede resolver su ticket**;
  `anon` no ve nada. Limpieza completa confirmada con `count(*)`.
- **Archivos:**
  `packages/db/migrations/20260809180000_support_tickets_rls_policies.sql`
  (nuevo).
- **Resultado:** verificación OK. Cierra el paso 3.4. Sigue el 3.5
  (`ticket_messages` — el caso más delicado: que una nota interna
  nunca llegue al cliente, ni en el conteo).
- **Commit:** `feat(db): políticas RLS de support_tickets — cliente abre el suyo, solo technician/master escriben`

### 2026-08-09 — paso 3.5 (RLS de ticket_messages — el caso delicado)

- **Hecho:** aplicada
  `packages/db/migrations/20260809190000_ticket_messages_rls_policies.sql`
  — `ticket_messages_read` (mensajes no internos de tickets de la
  propia empresa, o todo si es `technician`/`seller`/`master`),
  `ticket_messages_insert_owner` (cliente, siempre `is_internal =
  false` **en el `with check`**, no puede marcar su propio mensaje
  como interno), `ticket_messages_insert_staff`
  (`technician`/`seller`/`master`, cualquiera de los dos).
- **Verificación:** real vía `execute_sql`, la más exhaustiva de la
  fase. Cliente A escribe un mensaje no interno en su ticket; **no
  puede** insertar uno marcado `is_internal = true`
  (`insufficient_privilege` — el `with check` lo bloquea, no depende
  de que el cliente "decida" no marcarlo); **no puede** escribir en el
  ticket de otro cliente. El técnico agrega una nota interna y una
  respuesta pública (3 mensajes reales). **El cliente ve exactamente 2
  — nunca 3, ni siquiera contando** (`count(*) where is_internal =
  true` da `0` para el cliente, la prueba explícita que pedía el plan).
  El técnico ve los 3. Otra empresa y `anon` no ven nada. Limpieza
  completa confirmada con `count(*)`.
- **Archivos:**
  `packages/db/migrations/20260809190000_ticket_messages_rls_policies.sql`
  (nuevo).
- **Resultado:** verificación OK. **Cierra el paso 3.5 y — junto con
  3.1–3.4 — la Fase 3 (RLS) completa de esta tarea.** Sigue el 3.6
  (`get_advisors` de cierre).
- **Commit:** `feat(db): políticas RLS de ticket_messages — una nota interna nunca llega al cliente, ni en el conteo`

### 2026-08-09 — paso 3.6 (get_advisors de cierre de Fase 3)

- **Hallazgo real (no cosmético):** `get_advisors` mostró
  `auth_assigned_equipment_ids()` (creada en el paso 3.2) ejecutable
  por **`anon`** — `auth_company_ids()`/`auth_role()` sí tenían el
  `execute` de `PUBLIC` revocado desde la Fase 1, esta función nueva
  no. Un primer intento de `revoke execute ... from anon` no bastó:
  `pg_proc.proacl` seguía con el grant de `PUBLIC` (`=X/postgres`), y
  `anon` hereda de `PUBLIC` — confirmado con `has_function_privilege()`
  antes y después. Corregido con
  `revoke execute ... from public; grant execute ... to authenticated;`
  (`packages/db/migrations/20260809200000_fix_auth_assigned_equipment_ids_anon_grant.sql`),
  mismo patrón exacto que las otras dos funciones. Verificado con
  `has_function_privilege('anon', ...)` = `false` después.
- **Resultado del `get_advisors` final:** 2 INFO ya justificados
  (`product_documents`/`settings`), el mismo ERROR de `public_products`
  ya justificado, y ahora **3** WARN de funciones `security definer`
  ejecutables por `authenticated` (`auth_company_ids`/`auth_role`/
  `auth_assigned_equipment_ids`) — las tres intencionales, son las que
  hacen posible el RLS de todo el proyecto. Nada sin explicar.
- **Archivos:**
  `packages/db/migrations/20260809200000_fix_auth_assigned_equipment_ids_anon_grant.sql`
  (nuevo).
- **Resultado:** verificación OK, con un hallazgo real corregido.
  **Cierra el paso 3.6 y la Fase 3 (RLS) completa de esta tarea** — las
  5 tablas de postventa con políticas reales, probadas con empresas,
  vendedores, técnicos y roles reales. Sigue la Fase 4 (generación de
  `owned_equipment` al entregar un pedido).
- **Commit:** `fix(db): revoca acceso anónimo a auth_assigned_equipment_ids — hallazgo de get_advisors`

### 2026-08-09 — paso 4.1 (markOrderDelivered — genera owned_equipment)

- **Hecho:** `packages/core/src/service/mark-order-delivered.ts` —
  `markOrderDelivered(client, serviceClient, orderId, ctx)`: valida el
  pedido y su estado, actualiza `orders.status = 'delivered'` con la
  sesión de staff (`orders_update_staff` ya lo permite), genera un
  `owned_equipment` por **unidad** de cada `order_item` cuyo producto
  es `is_serialized` (usa `serviceClient`, `owned_equipment_write_master`
  no deja insertar a `authenticated` salvo `master`), registra
  `audit_log` (`order.delivered` + un `equipment.created` por equipo).
  **Desviación deliberada documentada en el propio archivo:** el plan
  preveía el botón solo con `status = 'shipped'`, pero ninguna acción
  de la Fase 3 mueve un pedido a `preparing`/`shipped` (`uploadShipment`
  a propósito no toca `status`) — no existe esa UI intermedia todavía.
  Se acepta `paid`/`preparing`/`shipped` como estado previo válido, no
  solo `shipped`, para no bloquear la única acción que sí se construye
  en esta fase.
- **Verificación:** `pnpm typecheck`/`pnpm lint` verdes en los 7
  paquetes. 3 pruebas unitarias nuevas con fakes de los dos clientes
  (rechaza pedido ya `delivered`, genera un equipo por unidad
  serializada e ignora insumos, no genera nada si no hay productos
  serializados) — 35/35 en `@tecni/core`. Verificación real vía
  `execute_sql`: pedido con 2 unidades de un producto serializado y 3
  de un insumo — `customer` no puede marcar el pedido entregado
  (`orders_update_staff` lo bloquea, el intento no tuvo efecto);
  `seller` asignado sí puede; se generan exactamente 2
  `owned_equipment` (ninguno del insumo); el cliente ya ve sus 2
  equipos nuevos (política del paso 3.1); el cliente **no** puede
  insertarlos él mismo (`insufficient_privilege`, reconfirma que hace
  falta `service_role`). Limpieza completa confirmada con `count(*)`.
- **Archivos:** `packages/core/src/service/{mark-order-delivered.ts,
  mark-order-delivered.test.ts}`, `packages/core/src/index.ts`.
- **Resultado:** verificación OK. Cierra el paso 4.1. Sigue el 4.2
  (botón "Marcar como entregado" en `/ventas/pedidos/[orderNumber]`).
- **Commit:** `feat(core): markOrderDelivered — genera owned_equipment al entregar un pedido`

### 2026-08-09 — paso 4.2 (botón "Marcar como entregado")

- **Hecho:** `markOrderDeliveredAction()` en
  `apps/web/app/(staff)/ventas/pedidos/actions.ts` — mismo patrón que
  `uploadShipmentAction`, arma el `serviceClient` y llama
  `markOrderDelivered(client, serviceClient, orderId, ctx)`. Botón
  "Marcar como entregado" en `/ventas/pedidos/[orderNumber]`, visible
  cuando `order.status` está en `{paid, preparing, shipped}` —
  `DELIVERABLE_STATUSES`, el mismo conjunto que acepta la función de
  `packages/core` (paso 4.1, desviación ya documentada: no solo
  `shipped`, porque no existe UI para mover a `preparing`/`shipped`
  todavía). Banner de confirmación `?delivered=1`.
- **Verificación:** `pnpm typecheck`/`pnpm lint` verdes en los 7
  paquetes. Sin verificación real nueva de RLS — este paso es
  solamente wiring de UI sobre `markOrderDelivered`, ya probado con
  datos reales de punta a punta en el paso 4.1 (customer bloqueado,
  vendedor autorizado, `service_role` genera el equipo, el cliente ya
  lo ve). El conjunto `DELIVERABLE_STATUSES` del botón se revisó
  manualmente contra el de la función para que no diverjan.
- **Archivos:** `apps/web/app/(staff)/ventas/pedidos/{actions.ts,
  [orderNumber]/page.tsx}`.
- **Resultado:** verificación OK. **Cierra el paso 4.2 y la Fase 4
  completa** (generación de `owned_equipment` de punta a punta, desde
  la función hasta el botón). Sigue la Fase 5 (equipos y manuales del
  cliente).
- **Commit:** `feat(web): botón "Marcar como entregado" en /ventas/pedidos`

### 2026-08-09 — paso 5.1 (/mi-cuenta/equipos)

- **Hecho:** `apps/web/app/(customer)/mi-cuenta/equipos/page.tsx` —
  lista de `owned_equipment` de la empresa (`owned_equipment_read` ya
  la limita), con nombre del producto (join), serial (o "sin serial
  registrado" — honesto, ninguna función de esta fase captura seriales
  todavía), fecha de entrega, y badge "Inactivo" si `is_active =
  false`. Cada fila enlaza a `/mi-cuenta/equipos/[id]`, que se
  construye en el siguiente paso (5.2) — enlace hacia adelante dentro
  de la misma fase, no hacia una función que no vaya a existir.
  Se agregó una tarjeta "Equipos" en `/mi-cuenta` (paso 9.1 de la
  Fase 3), con el conteo real.
- **Verificación:** `pnpm typecheck`/`pnpm lint` verdes en los 7
  paquetes. Verificación real vía `execute_sql`: dos empresas, un
  equipo real de la empresa A — la consulta exacta de la página (join
  a `products` para el nombre) funciona con la sesión del dueño;
  empresa B no ve nada. Limpieza completa confirmada con `count(*)`.
- **Archivos:** `apps/web/app/(customer)/mi-cuenta/equipos/page.tsx`
  (nuevo), `apps/web/app/(customer)/mi-cuenta/page.tsx`.
- **Resultado:** verificación OK. Cierra el paso 5.1. Sigue el 5.2
  (detalle de equipo, manual "pendiente de sincronización").
- **Commit:** `feat(web): /mi-cuenta/equipos — lista de equipos adquiridos de la empresa`

### 2026-08-09 — paso 5.2 (detalle de equipo)

- **Hecho:** `apps/web/app/(customer)/mi-cuenta/equipos/[id]/page.tsx`
  — datos completos (serial, entregado, garantía con "vigente
  hasta"/"venció el" según la fecha, ubicación si existe, activo/
  inactivo), sección "Manual" con "Pendiente de sincronización" (sin
  R2, mismo criterio que la factura en Fase 3). **Desviación del plan
  original:** sin accesos a "agendar mantenimiento"/"abrir ticket" —
  esos flujos son las Fases 6 y 7 de esta misma tarea, todavía no
  existen; se agregan cuando se construyan (6.2/7.1), no se fabrica un
  enlace a una acción que no hace nada.
- **Verificación:** `pnpm typecheck`/`pnpm lint` verdes en los 7
  paquetes. Verificación real vía `execute_sql`: dos empresas, un
  equipo real con garantía y ubicación — el dueño lee el detalle
  completo (incluida `warranty_until`), empresa B no ve nada.
  Limpieza completa confirmada con `count(*)`.
- **Archivos:**
  `apps/web/app/(customer)/mi-cuenta/equipos/[id]/page.tsx` (nuevo).
- **Resultado:** verificación OK. **Cierra el paso 5.2 y la Fase 5
  completa** (lista y detalle de equipos, manual honesto sobre R2).
  Sigue la Fase 6 (mantenimiento).
- **Commit:** `feat(web): detalle de equipo — manual pendiente de sincronización`

### 2026-08-09 — paso 6.1 (requestMaintenance)

- **Hecho:** `packages/core/src/service/request-maintenance.ts` —
  `requestMaintenance(client, input, ctx)`: inserta en
  `maintenance_requests` (`status = 'requested'`, default del esquema,
  sin técnico asignado). No repite validación de ownership del equipo
  en la función — confía en `maintenance_insert_owner`
  (05-RLS-SECURITY-C.md), que ya lo valida en el `with check`.
- **Verificación:** `pnpm typecheck`/`pnpm lint` verdes en los 7
  paquetes. 3 pruebas unitarias nuevas (crea con los datos correctos,
  fecha/descripción opcionales, propaga error de la base) — 38/38 en
  `@tecni/core`. Verificación real vía `execute_sql`: cliente agenda
  sobre su propio equipo (`status` queda `requested`); el mismo cliente
  **no puede** agendar sobre el equipo de otra empresa
  (`insufficient_privilege`, RLS lo bloquea sin que la función tenga
  que revisarlo). Limpieza completa confirmada con `count(*)`.
- **Archivos:** `packages/core/src/service/{request-maintenance.ts,
  request-maintenance.test.ts}`, `packages/core/src/index.ts`.
- **Resultado:** verificación OK. Cierra el paso 6.1. Sigue el 6.2
  (vista del cliente de sus solicitudes — incluye el formulario para
  agendar, no construido en un paso aparte).
- **Commit:** `feat(core): requestMaintenance — el cliente agenda sobre un equipo propio`

### 2026-08-09 — paso 6.2 (vista del cliente + formulario para agendar)

- **Hecho:** `apps/web/app/(customer)/mi-cuenta/mantenimientos/{page.tsx,
  actions.ts}` — `requestMaintenanceAction()` (mismo patrón que las
  demás Server Actions de `(customer)`, resuelve sesión/empresa y llama
  `requestMaintenance`). La página incluye el formulario para agendar
  (select de equipos activos, fecha preferida, descripción — no se
  construyó en un paso aparte, el plan no tenía uno) y la lista de
  solicitudes propias con estado en español
  (`MAINTENANCE_STATUS_LABEL`). Sin equipos activos, el formulario no
  se muestra — mensaje honesto en vez de un formulario vacío que
  fallaría igual por RLS. Tarjeta "Mantenimientos" agregada a
  `/mi-cuenta` con el conteo real.
- **Verificación:** `pnpm typecheck`/`pnpm lint` verdes en los 7
  paquetes. Verificación real vía `execute_sql`: dos empresas, un
  equipo real de la empresa A — el dropdown de equipos activos y la
  lista de solicitudes (con el join hasta el nombre del producto)
  funcionan con la sesión del dueño; empresa B no ve ni el equipo ni la
  solicitud. Limpieza completa confirmada con `count(*)`.
- **Archivos:**
  `apps/web/app/(customer)/mi-cuenta/mantenimientos/{page.tsx,
  actions.ts}` (nuevos), `apps/web/app/(customer)/mi-cuenta/page.tsx`.
- **Resultado:** verificación OK. **Cierra el paso 6.2 y la parte del
  cliente de la Fase 6.** Sigue el 6.3
  (`/tecnico/mantenimientos` — primer uso real del prefijo `/tecnico`).
- **Commit:** `feat(web): /mi-cuenta/mantenimientos — agendar y ver solicitudes del cliente`

### 2026-08-09 — paso 6.3 (/tecnico/mantenimientos)

- **Hecho:** `packages/core/src/service/update-maintenance-status.ts` —
  `confirmMaintenance(client, requestId)` (`status = 'confirmed'`,
  `confirmed_at`) y `rescheduleMaintenance(client, requestId,
  scheduledAt)` (`status = 'rescheduled'`, `scheduled_at`), ambas
  confiando en `maintenance_update_tech` (técnico asignado o master).
  `apps/web/app/(staff)/tecnico/mantenimientos/{page.tsx,actions.ts}`
  — **primer uso real del prefijo `/tecnico`** (protegido por el
  middleware para `technician`/`master` desde la Fase 1, sin contenido
  hasta ahora). Lista lo que `maintenance_read` deja ver con esa
  sesión (asignado, o todo si es `master` — sin panel para "tomar" una
  solicitud sin asignar, documentado como fuera de alcance desde
  `14-MODULE-SERVICE.md`), botón "Confirmar" cuando el estado lo
  permite, formulario de reprogramar con fecha/hora.
- **Verificación:** `pnpm typecheck`/`pnpm lint` verdes en los 7
  paquetes. 3 pruebas unitarias nuevas de `confirmMaintenance`/
  `rescheduleMaintenance` — 41/41 en `@tecni/core`. Verificación real
  vía `execute_sql`: un técnico **ajeno** a la solicitud no la ve y su
  intento de confirmar no tiene efecto; el cliente tampoco puede
  confirmar su propia solicitud; el técnico **asignado** sí confirma y
  luego reprograma; `master` ve y actualiza cualquier solicitud, sin
  estar asignado. Limpieza completa confirmada con `count(*)`.
- **Archivos:** `packages/core/src/service/{update-maintenance-status.ts,
  update-maintenance-status.test.ts}`, `packages/core/src/index.ts`,
  `apps/web/app/(staff)/tecnico/mantenimientos/{page.tsx,actions.ts}`
  (nuevos).
- **Resultado:** verificación OK. Cierra el paso 6.3. Sigue el 6.4
  (reporte de mantenimiento al completar).
- **Commit:** `feat(web): /tecnico/mantenimientos — confirmar y reprogramar, primer uso real de /tecnico`

### 2026-08-09 — paso 6.4 (reporte de mantenimiento al completar)

- **Hecho:** `packages/core/src/service/complete-maintenance.ts` —
  `completeMaintenance(client, input, ctx)`: inserta el reporte
  (`work_done`, `recommendations`, `next_service_date` — adjuntos y
  firma del cliente quedan sin capturar, sin R2 todavía) y marca la
  solicitud `status = 'completed'`, `completed_at`. Confía en
  `maintenance_reports_insert_tech` (técnico asignado) y
  `maintenance_update_tech` — no repite esas validaciones.
  Server Action `completeMaintenanceAction()` y formulario "Completar
  con reporte" en `/tecnico/mantenimientos`, visible cuando el estado
  está en `{confirmed, rescheduled, in_progress}`.
- **Verificación:** `pnpm typecheck`/`pnpm lint` verdes en los 7
  paquetes. 3 pruebas unitarias nuevas de `completeMaintenance`
  (registra reporte y completa, propaga error del insert, avisa si el
  reporte se guardó pero el update falló) — 44/44 en `@tecni/core`.
  Verificación real vía `execute_sql`: un técnico ajeno no puede
  insertar el reporte (`insufficient_privilege`); el técnico asignado
  registra el reporte y la solicitud queda `completed`; el cliente ya
  ve el reporte (`maintenance_reports_read`, hereda de
  `maintenance_requests`). Limpieza completa confirmada con `count(*)`.
- **Archivos:** `packages/core/src/service/{complete-maintenance.ts,
  complete-maintenance.test.ts}`, `packages/core/src/index.ts`,
  `apps/web/app/(staff)/tecnico/mantenimientos/{page.tsx,actions.ts}`.
- **Resultado:** verificación OK. **Cierra el paso 6.4 y la Fase 6
  completa** (agendar → confirmar/reprogramar → reportar, de punta a
  punta con datos reales). Sigue la Fase 7 (tickets de soporte).
- **Commit:** `feat(web): completeMaintenance — reporte del técnico cierra el mantenimiento`

### 2026-08-09 — paso 7.1 (abrir ticket + verlo, nunca notas internas)

- **Hecho:** `packages/core/src/service/open-ticket.ts` —
  `openTicket(client, input, ctx)`: crea `support_tickets` con un
  `ticket_number` propio de la web (consecutivo generado, no viene de
  Siigo — soporte no es un documento fiscal), y si viene un mensaje
  inicial lo guarda **siempre `is_internal = false`** (el cliente nunca
  puede crear una nota interna — `ticket_messages_insert_owner` ya lo
  exige en el `with check`, esta función solo evita el viaje extra si
  no hay mensaje).
  `apps/web/app/(customer)/mi-cuenta/tickets/{page.tsx,actions.ts,
  [id]/page.tsx}` — formulario para abrir (asunto, equipo opcional,
  mensaje), lista de tickets propios, detalle con los mensajes (RLS ya
  filtra las notas internas, la página no repite ese filtro en el
  código, confía en `ticket_messages_read`). Tarjeta "Tickets de
  soporte" agregada a `/mi-cuenta`.
- **Verificación:** `pnpm typecheck`/`pnpm lint` verdes en los 7
  paquetes. 4 pruebas unitarias nuevas de `openTicket` (crea con
  mensaje inicial no interno, no inserta mensaje si no viene ninguno,
  rechaza asunto vacío, propaga error de la base) — 48/48 en
  `@tecni/core`. Verificación real vía `execute_sql`: cliente A abre su
  ticket con un mensaje; staff agrega una nota interna; **el cliente ve
  exactamente 1 mensaje — nunca la nota interna, ni en el conteo**;
  empresa B no ve nada del ticket. Limpieza completa confirmada con
  `count(*)`.
- **Archivos:** `packages/core/src/service/{open-ticket.ts,
  open-ticket.test.ts}`, `packages/core/src/index.ts`,
  `apps/web/app/(customer)/mi-cuenta/tickets/{page.tsx,actions.ts,
  [id]/page.tsx}` (nuevos), `apps/web/app/(customer)/mi-cuenta/page.tsx`.
- **Resultado:** verificación OK. Cierra el paso 7.1. Sigue el 7.2
  (el cliente responde su propio ticket).
- **Commit:** `feat(web): openTicket — el cliente abre y ve su ticket, nunca las notas internas`

### 2026-08-09 — paso 7.2 (el cliente responde su propio ticket)

- **Hecho:** `packages/core/src/service/reply-to-ticket.ts` —
  `replyToTicket(client, input, ctx)`: inserta en `ticket_messages`
  **siempre** `is_internal = false` — no hay ningún parámetro que
  pueda cambiar eso, el cliente no tiene forma de crear una nota
  interna desde este camino. `replyToTicketAction()` +
  formulario "Responder" en
  `apps/web/app/(customer)/mi-cuenta/tickets/[id]/page.tsx`, oculto
  cuando el ticket está `closed`.
- **Verificación:** `pnpm typecheck`/`pnpm lint` verdes en los 7
  paquetes. 3 pruebas unitarias nuevas de `replyToTicket` (inserta
  siempre no interno, rechaza mensaje vacío sin llegar a la base,
  propaga error de la base) — 51/51 en `@tecni/core`. Verificación
  real vía `execute_sql`: el cliente responde su propio ticket; el
  mismo cliente **no puede** insertar un mensaje marcado
  `is_internal = true` (`insufficient_privilege`, el `with check` lo
  bloquea aunque quisiera); una empresa distinta **no puede** responder
  el ticket de otra (`insufficient_privilege`). Limpieza completa
  confirmada con `count(*)`.
- **Archivos:** `packages/core/src/service/{reply-to-ticket.ts,
  reply-to-ticket.test.ts}`, `packages/core/src/index.ts`,
  `apps/web/app/(customer)/mi-cuenta/tickets/{actions.ts,
  [id]/page.tsx}`.
- **Resultado:** verificación OK. Cierra el paso 7.2. Sigue el 7.3
  (`/tecnico` o vista compartida con `/ventas` — staff ve, responde,
  agrega notas internas, cierra).
- **Commit:** `feat(web): replyToTicket — el cliente responde su propio ticket, siempre no interno`

## Bloqueos

- **R2 sin empezar:** bloquea servir manuales/adjuntos/firma real
  (`docs/11-STORAGE-R2.md`). No bloquea el resto de la fase — se muestra
  "pendiente de sincronización", mismo criterio que la factura en Fase 3.
- **Resend sin dominio verificado:** bloquea notificaciones por correo en
  cambios de estado (`progress/TODO.md`). Fuera de alcance de esta fase.

## Pendientes descubiertos

Ninguno todavía.
