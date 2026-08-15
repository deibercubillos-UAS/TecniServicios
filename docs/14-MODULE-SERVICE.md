# 14 — Módulo de servicio (postventa)

Volver a [`00-INDEX.md`](./00-INDEX.md) · Esquema en
[`04-DATABASE-SCHEMA-B.md`](./04-DATABASE-SCHEMA-B.md) sección 6 · RLS en
[`05-RLS-SECURITY-C.md`](./05-RLS-SECURITY-C.md) · Roles en
[`06-AUTH-ROLES.md`](./06-AUTH-ROLES.md)

---

## 1. Por qué existe

Un equipo vendido genera postventa (CLAUDE.md regla de negocio 5.5): manual
descargable, agendamiento de mantenimiento, tickets de soporte, historial de
servicio. Esto es lo que diferencia la plataforma de un catálogo cualquiera.

**Desviación deliberada, documentada desde el inicio de la tarea:**
`docs/11-STORAGE-R2.md` sigue sin empezar. Los manuales privados
(`product_documents`) y los adjuntos de reportes/tickets/firma no se sirven
todavía — se muestran como "pendiente de sincronización" en vez de un
enlace fabricado, mismo criterio ya aplicado a la factura en
`13-MODULE-COMMERCE.md` sección 6. El resto del flujo (agendar, confirmar,
ejecutar, reportar, abrir y responder tickets) funciona de punta a punta sin
depender de R2.

---

## 2. Equipo adquirido (`owned_equipment`)

Un pedido no genera postventa hasta que está **entregado**. `owned_equipment`
se crea, una fila por cada `order_item` de un producto serializado
(`products.is_serialized = true`), cuando el vendedor o master marca el
pedido como `delivered`.

**Quién lo dispara y cómo:** `markOrderDelivered(orderId)` en
`packages/core`, mismo patrón de dos clientes que `acceptQuote` (Fase 3,
`13-MODULE-COMMERCE.md`): la sesión de staff hace la actualización de
`orders.status` que su propia RLS ya permite (`orders_update_staff`,
vendedor asignado o master); `service_role` hace **solo** la creación de
`owned_equipment`, porque ninguna política de RLS deja que `authenticated`
inserte ahí directamente (ver `05-RLS-SECURITY-C.md`). Queda registrado en
`audit_log` (`order.delivered`, `equipment.created`) — toca pedido, regla de
oro 8 de `CLAUDE.md`.

Un producto no serializado (consumibles, insumos) no genera
`owned_equipment` — no tiene sentido agendar mantenimiento de un filtro de
aceite.

---

## 3. Manuales

`product_documents` (Fase 2, sin políticas hasta este módulo) se abre acá:
un manual se ve si es público, o si la empresa tiene un `owned_equipment` de
ese producto, o si quien pregunta es `technician`/`seller`/`master`. Sin R2
conectado, la ficha del equipo muestra "manual pendiente de sincronización"
en vez de intentar servir un archivo que no existe — ni siquiera si
`product_documents` tuviera una fila cargada, porque no hay forma de firmar
una URL de un bucket que no existe todavía.

---

## 4. Mantenimiento

```
Master abre disponibilidad (/admin/mantenimientos): fecha, cupo
(max_visits), técnico y ciudad/departamento opcionales como metadatos —
una fecha a la vez, o un rango de fechas × varios técnicos de una sola
vez (genera una fila por cada combinación fecha×técnico, tope 200 por
lote). El cupo sigue siendo compartido a nivel de día entre todas sus
filas, nunca se parte por técnico.
   │
   ▼
Cliente agenda (equipo propio, fecha preferida de las abiertas con
cupo, descripción)
   │  status = 'requested', sin técnico asignado a la solicitud todavía
   ▼
Master/vendedor asigna un technician_id a la SOLICITUD (fuera de
alcance un panel de asignación completo — se asigna directo en el
panel de ventas/admin existente, o vía SQL mientras no exista ese
panel; no confundir con el técnico de `maintenance_availability`,
que es solo informativo sobre quién cubre esa fecha, no una
asignación real de la solicitud)
   │
   ▼
Técnico confirma → status = 'confirmed', confirmed_at
   │  (puede reprogramar → 'rescheduled', nueva scheduled_at)
   ▼
Técnico ejecuta → status = 'in_progress' → 'completed', completed_at
   │
   ▼
Técnico escribe el reporte (maintenance_reports): trabajo realizado,
repuestos usados, recomendaciones, próxima fecha de servicio. Adjuntos y
firma del cliente quedan "pendiente de sincronización" sin R2.
```

**Disponibilidad (`maintenance_availability`):** ciudad/departamento se
eligen de un desplegable dependiente con datos reales de Colombia
(`apps/web/lib/colombia-geo.ts`) — nunca texto libre, evita error
ortográfico. `/admin/mantenimientos` incluye un calendario del mes
(solo lectura) mostrando cupo usado/total y técnico/ciudad por día, con
navegación anterior/siguiente vía `?month=YYYY-MM`.

**Quién ve qué:** el cliente ve las solicitudes de su empresa (crea, no
actualiza estado). El técnico ve y actualiza solo las que tiene asignadas
(`technician_id = auth.uid()`). El vendedor de esa empresa
(`companies.assigned_seller_id`) lee, no escribe. Master, todo.

---

## 5. Tickets de soporte

Un ticket puede o no estar ligado a un equipo (`equipment_id` nullable —
también sirve para dudas generales). El cliente lo abre y lo ve con sus
mensajes; el staff (técnico, vendedor, master) puede agregar **notas
internas** (`ticket_messages.is_internal = true`) que el cliente **nunca**
ve, ni en el conteo de mensajes — caso especial ya documentado en
`05-RLS-SECURITY-A.md` sección "ticket_messages".

```
Cliente abre ticket (subject, equipo opcional) → status = 'open'
   │
   ▼
Staff se asigna / lo asignan (assigned_to) → status = 'assigned'
   │  intercambio de mensajes (cliente ve solo is_internal = false;
   │  staff ve todo y puede agregar notas internas)
   ▼
Staff resuelve → status = 'resolved', resolved_at
   │  (el cliente puede seguir viendo el ticket, no reabrir automático)
   ▼
Staff cierra → status = 'closed'
```

`waiting_customer` es un estado intermedio cuando el staff necesita
respuesta del cliente antes de seguir — no automático, lo pone quien
responde.

---

## 6. Roles en este módulo

Matriz completa en `06-AUTH-ROLES.md` sección 2. Resumen de este módulo:

| Acción | customer | seller | technician | master |
|---|---|---|---|---|
| Ver equipos | 🔸 su empresa | 🔸 sus clientes | 🔸 asignados (vía mantenimiento) | ✅ |
| Marcar pedido entregado | ❌ | ✅ (sus clientes) | ❌ | ✅ |
| Agendar mantenimiento | ✅ | 🔸 a nombre del cliente | ❌ | ✅ |
| Confirmar/ejecutar mantenimiento | ❌ | ❌ | ✅ (asignado) | ✅ |
| Escribir reporte | ❌ | ❌ | ✅ (asignado) | ✅ |
| Abrir/responder ticket | ✅ | ❌ | ❌ | ✅ |
| Ver y responder tickets | 🔸 sus mensajes, sin notas internas | 🔸 lectura | ✅ | ✅ |
| Escribir nota interna | ❌ | ✅ | ✅ | ✅ |

**"A nombre del cliente" (vendedor)** queda fuera de alcance de esta fase —
requiere un panel de vendedor que actúe como un cliente específico, que es
Fase 5 del roadmap (panel maestro y contenido incluye herramientas de
staff más completas). Acá el vendedor tiene lectura sobre sus clientes,
igual que ya tiene sobre cotizaciones/pedidos desde la Fase 3.
