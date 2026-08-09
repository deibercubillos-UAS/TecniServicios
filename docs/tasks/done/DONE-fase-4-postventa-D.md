# TAREA: Fase 4 — Postventa (parte D: bitácora continuación, bloqueos, pendientes)

Parte A (plan): [`DONE-fase-4-postventa-A.md`](./DONE-fase-4-postventa-A.md)
Parte B (bitácora, pasos 1.1–3.2): [`DONE-fase-4-postventa-B.md`](./DONE-fase-4-postventa-B.md)
Parte C (bitácora, pasos 3.3–5.2): [`DONE-fase-4-postventa-C.md`](./DONE-fase-4-postventa-C.md)

## Bitácora (continuación)

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

### 2026-08-09 — paso 7.3 (panel de staff: ver, responder, notas internas, cerrar)

- **Hecho:** `packages/core/src/service/{staff-reply-to-ticket.ts,
  update-ticket-status.ts}` — `staffReplyToTicket(client, input, ctx)`
  con `isInternal` explícito (dos formularios/botones distintos en la
  UI, nunca un checkbox que se pueda dejar sin marcar por accidente);
  `updateTicketStatus(client, ticketId, status)` valida el estado
  contra una lista blanca y marca `resolved_at` solo al pasar a
  `resolved`.
  **Decisión del paso** (el plan la dejaba abierta): panel bajo
  `/tecnico/tickets`, no compartido con `/ventas` — el middleware
  protege rutas por prefijo completo (technician/master para
  `/tecnico`, seller/master para `/ventas`), no hay una ruta que ambos
  alcancen; como `seller` según la RLS solo tiene lectura + puede
  insertar notas internas pero **no** puede cambiar estado
  (`support_tickets_write_staff` lo excluye), construir un panel
  aparte solo para esa lectura limitada no se justifica en esta fase —
  queda anotado como pendiente si el negocio lo pide más adelante.
  `apps/web/app/(staff)/tecnico/tickets/{page.tsx,actions.ts,
  [id]/page.tsx}` — lista de todos los tickets (`support_tickets_read`
  es global para staff), detalle con **todos** los mensajes (incluidas
  notas internas, resaltadas visualmente), formulario "Responder al
  cliente" (siempre `isInternal=0`) y "Nota interna" (siempre
  `isInternal=1`) por separado, botones "Marcar resuelto"/"Cerrar
  ticket".
- **Verificación:** `pnpm typecheck`/`pnpm lint` verdes en los 7
  paquetes. 7 pruebas unitarias nuevas (`staffReplyToTicket`:
  público/interno/mensaje vacío; `updateTicketStatus`: estado
  válido/resolved marca `resolved_at`/estado inválido/error de base) —
  58/58 en `@tecni/core`. Verificación real vía `execute_sql`: `seller`
  agrega una nota interna (permitido) pero **no puede cerrar el
  ticket** (el `UPDATE` no tuvo efecto); `technician` responde, resuelve
  y cierra; el técnico ve los 3 mensajes reales (incluida la nota del
  vendedor); **el cliente sigue viendo solo 2 — nunca la nota interna**,
  ni antes ni después de que el ticket se resuelva/cierre. Limpieza
  completa confirmada con `count(*)`.
- **Archivos:** `packages/core/src/service/{staff-reply-to-ticket.ts,
  staff-reply-to-ticket.test.ts,update-ticket-status.ts,
  update-ticket-status.test.ts}`, `packages/core/src/index.ts`,
  `apps/web/app/(staff)/tecnico/tickets/{page.tsx,actions.ts,
  [id]/page.tsx}` (nuevos).
- **Resultado:** verificación OK. **Cierra el paso 7.3 y la Fase 7
  completa** (abrir → responder → staff modera con notas internas →
  cerrar, de punta a punta con datos reales). Sigue la Fase 8 (cierre:
  checklist de seguridad, roadmap/TODO/CHANGELOG, mover a
  `tasks/done/`).
- **Commit:** `feat(web): /tecnico/tickets — panel de staff con notas internas separadas del cliente`

### 2026-08-09 — paso 8.1 (checklist de seguridad + las tres preguntas)

- **Checklist de la sección 9 (`05-RLS-SECURITY-B.md`), aplicado a toda
  la Fase 4:**
  - [x] Toda tabla nueva tiene `enable row level security` (las 5
    tablas de postventa, pasos 2.2–2.4).
  - [x] Probado como anónimo, como otra empresa y como rol inferior —
    en cada paso, con datos reales (`execute_sql`).
  - [x] Ningún endpoint nuevo devuelve precios sin validar sesión — sin
    endpoints nuevos en esta fase (todo Server Actions), sin tocar
    `resolvePrice()`.
  - [~] Entrada validada con Zod — sigue sin Zod, mismo patrón
    `typeof` manual de todo el proyecto (ya anotado como deuda técnica
    en el cierre de Fase 3, `progress/TODO.md`).
  - [x] Ningún `service_role` fuera del servidor — el único uso nuevo
    (`markOrderDelivered`) está en un Server Action, nunca en un
    componente cliente.
  - [x] Todo cambio de precio/rol/pedido/cotización queda en
    `audit_log` — `markOrderDelivered` es la única función de esta
    fase que toca "pedido" (`orders.status`), y ya registra
    `order.delivered` + `equipment.created` (paso 4.1). El resto de
    funciones de postventa (mantenimiento, tickets) no tocan ninguna
    de las cuatro categorías de la regla de oro 8 — no les corresponde
    auditoría.
  - [x] Ningún error de base de datos llega crudo al cliente — todas
    las funciones nuevas de `packages/core` devuelven mensajes
    genéricos en español.
  - [ ] Archivos de R2 servidos firmados — N/A, R2 sigue sin empezar.
- **Las tres preguntas de `CLAUDE.md` sección 8, por módulo de esta
  fase** (verificado con datos reales en cada paso):
  - **Equipos (`owned_equipment`):** anónimo → nada. Otra empresa →
    nada (`owned_equipment_read`, paso 3.1). Rol inferior (`customer`
    intentando insertar/actualizar) → bloqueado siempre, solo
    `master`/`service_role` escriben — verificado real en 3.1 y de
    nuevo en el contexto completo de 4.1.
  - **Mantenimiento (`maintenance_requests`/`maintenance_reports`):**
    anónimo → nada. Otra empresa → nada (paso 3.2). Rol inferior
    (`customer` intentando confirmar/completar su propia solicitud, o
    técnico **ajeno** intentando tocar una que no es suya) →
    bloqueado siempre — verificado real en 3.2, 3.3, 6.3 y 6.4, con el
    hallazgo de recursión RLS corregido en 3.2.
  - **Tickets (`support_tickets`):** anónimo → nada. Otra empresa →
    nada, salvo el staff (soporte es global por diseño, no un fallo de
    aislamiento — documentado explícito en 3.4/7.3). Rol inferior
    (`customer` intentando cambiar estado, o `seller` intentando
    cerrar un ticket) → bloqueado siempre — verificado real en 3.4 y
    7.3.
  - **Notas internas (`ticket_messages.is_internal`):** el caso más
    delicado de la fase — verificado real en 3.5 y de nuevo en 7.3 que
    el cliente **nunca** ve una nota interna, ni en el conteo, ni
    antes ni después de que el ticket se resuelva o cierre.
- **Verificación:** `get_advisors` (seguridad) corrido de nuevo al
  cierre: 2 INFO ya justificados (`product_documents`/`settings`), el
  mismo ERROR de `public_products` ya justificado, 3 WARN de funciones
  `security definer` ejecutables por `authenticated`
  (`auth_company_ids`/`auth_role`/`auth_assigned_equipment_ids`) — las
  tres intencionales. Sin hallazgos nuevos esta vez (a diferencia del
  cierre de Fase 3, donde el checklist encontró dos defectos reales).
- **Archivos:** ninguno (paso de revisión, sin cambios de código).
- **Resultado:** verificación OK, sin hallazgos nuevos. Cierra el paso
  8.1. Sigue el 8.2 (roadmap, TODO, CHANGELOG, mover la tarea a
  `tasks/done/` — cierre de la Fase 4 completa).
- **Commit:** N/A (sin cambios de archivo, solo bitácora)

## Bloqueos

- **R2 sin empezar:** bloquea servir manuales/adjuntos/firma real
  (`docs/11-STORAGE-R2.md`). No bloquea el resto de la fase — se muestra
  "pendiente de sincronización", mismo criterio que la factura en Fase 3.
- **Resend sin dominio verificado:** bloquea notificaciones por correo en
  cambios de estado (`progress/TODO.md`). Fuera de alcance de esta fase.

## Pendientes descubiertos

Ninguno todavía.
