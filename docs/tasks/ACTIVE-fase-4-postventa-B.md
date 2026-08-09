# TAREA: Fase 4 — Postventa (parte B: bitácora, bloqueos, pendientes)

Parte A (plan): [`ACTIVE-fase-4-postventa-A.md`](./ACTIVE-fase-4-postventa-A.md)

## Bitácora

### 2026-08-09 — paso 1.1 (docs/14-MODULE-SERVICE.md)

- **Hecho:** escrito `docs/14-MODULE-SERVICE.md` — por qué existe (regla
  de negocio 5.5 de `CLAUDE.md`), generación de `owned_equipment` al
  entregar un pedido (`markOrderDelivered`, mismo patrón de dos clientes
  que `acceptQuote` de la Fase 3: sesión de staff hace lo que
  `orders_update_staff` ya permite, `service_role` hace solo la
  creación de `owned_equipment`), manuales "pendiente de sincronización"
  sin R2, flujo completo de mantenimiento (solicitar → asignar →
  confirmar → ejecutar → reportar), flujo de tickets con notas internas
  (caso especial ya documentado en `05-RLS-SECURITY-A.md`, referenciado
  no repetido), matriz de roles del módulo. No repite el esquema
  (`04-DATABASE-SCHEMA-B.md` sección 6 ya lo tiene completo desde la
  Fase 0).
- **Archivos:** `docs/14-MODULE-SERVICE.md` (nuevo, 139 líneas),
  `docs/00-INDEX.md` (estado 14 → ✅).
- **Resultado:** verificación OK, bajo el límite de 500 líneas.
- **Commit:** `docs(service): agrega 14-MODULE-SERVICE.md`

### 2026-08-09 — paso 1.2 (sección RLS "Postventa")

- **Hecho:** completada la sección "Postventa" en la política por tabla —
  `owned_equipment` (lectura por empresa/vendedor asignado vía
  `companies.assigned_seller_id`/técnico asignado vía
  `maintenance_requests.technician_id`/master; sin insert/update para
  `authenticated` salvo `master`, la creación real la hace
  `service_role` desde `markOrderDelivered()`), `maintenance_requests`
  (insert del cliente validando que el equipo sea de su empresa,
  `maintenance_update_tech` ya existía, se agregó
  `maintenance_assign_staff` para que vendedor/master puedan poner el
  `technician_id` antes de que sea "suyo"), `maintenance_reports`
  (insert solo del técnico asignado, inmutable), `support_tickets`
  (insert del cliente, escritura solo `technician`/`master` —
  `seller` queda solo lectura, exacto a la matriz de
  `06-AUTH-ROLES.md`), `ticket_messages` (insert separado para
  cliente —siempre `is_internal = false`, no puede marcar su propio
  mensaje como interno— y para staff, que sí puede insertar notas
  internas).
  **Se dividió `05-RLS-SECURITY-A.md`** (llegó a 602 líneas con la
  sección nueva) en `-A.md` (postura, reglas, precios, políticas hasta
  `contact_messages`) y `-C.md` (nuevo — comercio + postventa, las dos
  secciones más largas), en el límite exacto de la sección
  "Comercio"/"Postventa" (nunca a mitad de una sección). Referencias
  actualizadas en `14-MODULE-SERVICE.md`, `13-MODULE-COMMERCE.md`,
  `05-RLS-SECURITY-B.md`, `00-INDEX.md` — los punteros genéricos a
  `05-RLS-SECURITY-A.md` en otros docs (auth-roles, schema, deployment,
  testing) se dejaron igual porque siguen siendo válidos (A sigue
  siendo la puerta de entrada del documento completo).
- **Archivos:** `docs/05-RLS-SECURITY-A.md`, `docs/05-RLS-SECURITY-B.md`,
  `docs/05-RLS-SECURITY-C.md` (nuevo), `docs/14-MODULE-SERVICE.md`,
  `docs/13-MODULE-COMMERCE.md`, `docs/00-INDEX.md`.
- **Resultado:** verificación OK, las tres partes bajo el límite de 500
  líneas. Verificación real con datos queda para la Fase 3 de esta
  tarea (paso 3.1–3.6), como en Fase 3 de comercio — acá es solo
  documento, todavía sin migración aplicada.
- **Commit:** `docs(service): completa la sección RLS de postventa, divide 05-RLS-SECURITY-A.md en -A.md/-C.md`

## Bloqueos

- **R2 sin empezar:** bloquea servir manuales/adjuntos/firma real
  (`docs/11-STORAGE-R2.md`). No bloquea el resto de la fase — se muestra
  "pendiente de sincronización", mismo criterio que la factura en Fase 3.
- **Resend sin dominio verificado:** bloquea notificaciones por correo en
  cambios de estado (`progress/TODO.md`). Fuera de alcance de esta fase.

## Pendientes descubiertos

Ninguno todavía.
