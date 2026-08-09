# TAREA: Fase 4 — Postventa (parte A: plan)

Parte B (bitácora, bloqueos, pendientes): [`ACTIVE-fase-4-postventa-B.md`](./ACTIVE-fase-4-postventa-B.md)

**Estado:** En curso · **Riesgo:** Riesgoso (RLS, notas internas, roles, empresa)
**Inicio:** 2026-08-09

---

## 0. Objetivo

Que un pedido entregado genere postventa real: el cliente ve su equipo y su
manual, agenda mantenimiento, un técnico lo confirma y ejecuta con reporte, y
el cliente abre tickets de soporte — sin que una nota interna llegue nunca al
cliente. Esto es lo que diferencia la plataforma de un catálogo (`CLAUDE.md`
sección 5.5).

**Desviación deliberada, documentada desde ya:** `docs/11-STORAGE-R2.md`
sigue sin empezar (`progress/TODO.md`). Los manuales privados
(`product_documents`) y los adjuntos de reportes/tickets **no se sirven**
en esta fase — se muestran como "pendiente de sincronización", mismo
criterio ya aplicado a la factura en la Fase 3 (paso 8.3), nunca un enlace
fabricado. El flujo completo (agendar → confirmar → ejecutar → reportar →
ticket) sí se construye de punta a punta, funciona sin archivos.

**Esquema y RLS ya diseñados de antes** (Fase 0): `04-DATABASE-SCHEMA-B.md`
sección 6 tiene las 5 tablas completas
(`owned_equipment`/`maintenance_requests`/`maintenance_reports`/
`support_tickets`/`ticket_messages`) y sus enums en `-A.md`.
`05-RLS-SECURITY-A.md` ya documenta el patrón de `maintenance_requests` y el
caso especial de `ticket_messages` (notas internas). Esta fase completa lo
que falta (`owned_equipment`/`support_tickets` no tienen columna de
vendedor/técnico asignado directa — se resuelven vía
`companies.assigned_seller_id` y `maintenance_requests.technician_id`, no
con el patrón genérico copiado tal cual) y lo aplica con datos reales.

---

## Fase 1 — Documentación

- [x] **1.1** `docs/14-MODULE-SERVICE.md`: generación de `owned_equipment` al
  entregar un pedido (quién la dispara, qué patrón de cliente privilegiado
  usa — mismo que `acceptQuote` de la Fase 3), flujo de mantenimiento
  completo, flujo de tickets con notas internas, manuales "pendiente de
  sincronización" sin R2.
- [x] **1.2** Completar la sección "Postventa" de `05-RLS-SECURITY-C.md`:
  políticas exactas de `owned_equipment` (lectura empresa/técnico
  asignado vía `maintenance_requests`/vendedor asignado vía
  `companies.assigned_seller_id`/master; escritura solo
  `service_role`/master) y `support_tickets`/`ticket_messages` (insert
  del cliente, asignación y notas internas del staff).

## Fase 2 — Esquema

- [x] **2.1** Verificar los enums `maintenance_status`/`ticket_status`/
  `ticket_priority` (puede que ya estén aplicados desde la Fase 0).
- [x] **2.2** Migración `owned_equipment`, RLS habilitada sin políticas.
- [x] **2.3** Migración `maintenance_requests` + `maintenance_reports`, RLS
  habilitada sin políticas.
- [x] **2.4** Migración `support_tickets` + `ticket_messages`, RLS
  habilitada sin políticas.
- [x] **2.5** `get_advisors` (seguridad) — cero advertencias sin justificar.

## Fase 3 — RLS (prueba real: anónimo, otra empresa, rol inferior)

- [x] **3.1** `owned_equipment`: empresa dueña lee lo suyo, vendedor
  asignado (`companies.assigned_seller_id`) lee lo de sus clientes,
  técnico lee lo que tiene asignado en `maintenance_requests`, master
  todo. Sin insert para `authenticated` — solo `service_role`/master.
- [x] **3.2** `maintenance_requests`: cliente (`owner`/`buyer`/`workshop`)
  crea y lee las de su empresa, técnico asignado lee y actualiza las
  suyas, vendedor de la empresa lee, master todo.
- [x] **3.3** `maintenance_reports`: solo el técnico asignado a la
  solicitud escribe; empresa/técnico/vendedor/master leen.
- [x] **3.4** `support_tickets`: cliente abre y lee los suyos, técnico/
  vendedor/master ven y se asignan, master reasigna.
- [x] **3.5** `ticket_messages`: cliente inserta y lee solo mensajes
  **no internos** de sus tickets; staff (técnico/vendedor/master) lee
  todo e inserta notas internas. Prueba explícita: el cliente nunca ve
  una nota interna, ni en el conteo.
- [ ] **3.6** `get_advisors` de cierre.

## Fase 4 — Generación de equipo adquirido

- [ ] **4.1** `markOrderDelivered(orderId)` en `packages/core` — vendedor/
  master marca `orders.status = 'delivered'` y genera un
  `owned_equipment` por cada `order_item` de un producto serializado
  (`products.is_serialized`), con `audit_log`. Mismo patrón de dos
  clientes que `acceptQuote` (Fase 3): la sesión de staff hace lo que
  su RLS ya permite, `service_role` hace solo la creación de
  `owned_equipment` que ninguna política deja hacer a `authenticated`
  directamente.
- [ ] **4.2** Botón "Marcar como entregado" en `/ventas/pedidos/[orderNumber]`
  (solo cuando `status = 'shipped'`).

## Fase 5 — Equipos y manuales del cliente

- [ ] **5.1** `/mi-cuenta/equipos`: lista de equipos adquiridos de la
  empresa (serial, producto, fecha de entrega, garantía).
- [ ] **5.2** Detalle de equipo: manual "pendiente de sincronización" (sin
  R2 todavía), datos completos, accesos rápidos a agendar mantenimiento
  y abrir ticket.

## Fase 6 — Mantenimiento

- [ ] **6.1** `requestMaintenance(equipmentId, preferredDate, description)`
  — el cliente agenda sobre un equipo propio.
- [ ] **6.2** Vista del cliente: sus solicitudes de mantenimiento y estado.
- [ ] **6.3** `/tecnico/mantenimientos` — lista de solicitudes asignadas al
  técnico (y sin asignar, si `master`), confirmar/reprogramar.
- [ ] **6.4** Reporte de mantenimiento — el técnico lo escribe al
  completar (`work_done`, recomendaciones, próxima fecha de servicio);
  adjuntos y firma quedan "pendiente de sincronización" sin R2.

## Fase 7 — Tickets de soporte

- [ ] **7.1** El cliente abre un ticket (opcionalmente ligado a un
  equipo) y lo ve con sus mensajes — **nunca** las notas internas.
- [ ] **7.2** El cliente responde su propio ticket.
- [ ] **7.3** `/tecnico` (o vista compartida con `/ventas`, a decidir en
  el paso): staff ve tickets, responde, agrega notas internas, cierra.

## Fase 8 — Cierre

- [ ] **8.1** Checklist de seguridad de `05-RLS-SECURITY-B.md` sección 9 +
  las tres preguntas de `CLAUDE.md` — con foco especial en que una nota
  interna **nunca** llegue al cliente, ni en un conteo.
- [ ] **8.2** Actualizar `21-ROADMAP.md`/`progress/TODO.md`/
  `progress/CHANGELOG.md`, mover la tarea a `tasks/done/`.

---

## Fuera de alcance de esta fase (anotado, no se construye acá)

- Servir manuales/adjuntos/firma real desde R2 — `11-STORAGE-R2.md`, sin
  empezar.
- Notificaciones por correo en cada cambio de estado — depende de dominio
  de producción (`10-INTEGRATION-RESEND.md`, bloqueado, ver `progress/TODO.md`).
- Agenda de visitas del vendedor, panel de vendedor completo — Fase 5 del
  roadmap.
- MFA obligatorio para `seller`/`technician`/`master` (`06-AUTH-ROLES.md`
  sección 5) — no se ha implementado en ninguna fase anterior, no es
  bloqueante de esta.
