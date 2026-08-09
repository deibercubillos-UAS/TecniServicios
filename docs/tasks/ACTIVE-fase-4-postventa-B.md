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

### 2026-08-09 — paso 2.1 (enums de postventa)

- **Hecho:** verificado con `execute_sql` — a diferencia de los enums de
  comercio (ya sembrados desde la Fase 0), `maintenance_status`/
  `ticket_status`/`ticket_priority` **no existían**. Aplicada
  `packages/db/migrations/20260809100000_create_service_enums.sql`
  (`create_service_enums`, exacta a `04-DATABASE-SCHEMA-A.md`).
- **Verificación:** `enum_range()` de los tres tipos devuelve exactamente
  los valores documentados: `maintenance_status`
  (`requested,confirmed,rescheduled,in_progress,completed,cancelled`),
  `ticket_status`
  (`open,assigned,waiting_customer,resolved,closed`), `ticket_priority`
  (`low,medium,high,critical`).
- **Archivos:**
  `packages/db/migrations/20260809100000_create_service_enums.sql`
  (nuevo).
- **Resultado:** verificación OK. Cierra el paso 2.1. Sigue el 2.2
  (migración `owned_equipment`).
- **Commit:** `feat(db): crea los enums de postventa (maintenance_status, ticket_status, ticket_priority)`

### 2026-08-09 — paso 2.2 (migración owned_equipment)

- **Hecho:** aplicada
  `packages/db/migrations/20260809110000_create_owned_equipment.sql` —
  exacta a `04-DATABASE-SCHEMA-B.md` sección 6. RLS habilitada, cero
  políticas (bloqueada por completo, estado esperado hasta el paso
  3.1).
- **Verificación:** columnas y tipos verificados con
  `information_schema.columns` (10 columnas, exacto al esquema).
  `pg_class.relrowsecurity = true`, `pg_policies` con 0 filas para
  `owned_equipment`.
- **Archivos:**
  `packages/db/migrations/20260809110000_create_owned_equipment.sql`
  (nuevo).
- **Resultado:** verificación OK. Cierra el paso 2.2. Sigue el 2.3
  (`maintenance_requests` + `maintenance_reports`).
- **Commit:** `feat(db): crea owned_equipment`

### 2026-08-09 — paso 2.3 (migración maintenance_requests + maintenance_reports)

- **Hecho:** aplicada
  `packages/db/migrations/20260809120000_create_maintenance.sql` —
  exacta a `04-DATABASE-SCHEMA-B.md` sección 6. RLS habilitada, cero
  políticas en ambas.
- **Verificación:** columnas verificadas con `information_schema.columns`
  (13 en `maintenance_requests`, 10 en `maintenance_reports`, exacto al
  esquema). `pg_class.relrowsecurity = true` en las dos, `pg_policies`
  con 0 filas.
- **Archivos:**
  `packages/db/migrations/20260809120000_create_maintenance.sql`
  (nuevo).
- **Resultado:** verificación OK. Cierra el paso 2.3. Sigue el 2.4
  (`support_tickets` + `ticket_messages`).
- **Commit:** `feat(db): crea maintenance_requests y maintenance_reports`

### 2026-08-09 — paso 2.4 (migración support_tickets + ticket_messages)

- **Hecho:** aplicada
  `packages/db/migrations/20260809130000_create_support_tickets.sql` —
  exacta a `04-DATABASE-SCHEMA-B.md` sección 6. RLS habilitada, cero
  políticas en ambas.
- **Verificación:** columnas verificadas con `information_schema.columns`
  (12 en `support_tickets`, 7 en `ticket_messages`, exacto al esquema).
  `pg_class.relrowsecurity = true` en las dos, `pg_policies` con 0
  filas.
- **Archivos:**
  `packages/db/migrations/20260809130000_create_support_tickets.sql`
  (nuevo).
- **Resultado:** verificación OK. **Cierra el paso 2.4 y la Fase 2
  completa** (las 5 tablas de postventa creadas). Sigue el 2.5
  (`get_advisors` de cierre).
- **Commit:** `feat(db): crea support_tickets y ticket_messages`

### 2026-08-09 — paso 2.5 (get_advisors de cierre de Fase 2)

- **Hecho:** corrido `get_advisors` (tipo `security`) tras crear las 5
  tablas de postventa. Resultado: 7 INFO `rls_enabled_no_policy` (las 5
  tablas nuevas — `owned_equipment`/`maintenance_requests`/
  `maintenance_reports`/`support_tickets`/`ticket_messages`, esperado
  hasta la Fase 3 de esta tarea, + los 2 ya justificados desde antes
  `product_documents`/`settings`), el mismo ERROR de `public_products`
  ya justificado, los mismos 2 WARN de `auth_company_ids`/`auth_role`
  ya justificados. Nada nuevo sin explicar.
- **Archivos:** ninguno (paso de solo lectura).
- **Resultado:** verificación OK. **Cierra la Fase 2 (esquema) de la
  tarea.** Sigue la Fase 3 (RLS real: anónimo, otra empresa, rol
  inferior — con foco especial en que una nota interna nunca llegue al
  cliente).
- **Commit:** N/A (sin cambios de archivo, solo bitácora)

### 2026-08-09 — paso 3.1 (RLS de owned_equipment)

- **Hecho:** aplicada
  `packages/db/migrations/20260809140000_owned_equipment_rls_policies.sql`
  — exacta a `05-RLS-SECURITY-C.md`: `owned_equipment_read` (empresa
  dueña, vendedor asignado vía `companies.assigned_seller_id`, técnico
  vía `maintenance_requests.technician_id`, master),
  `owned_equipment_write_master` (solo `master` para
  insert/update/delete — la creación real es `service_role` desde
  `markOrderDelivered()`, paso 4.1).
- **Verificación:** real vía `execute_sql`, dos empresas, vendedor
  asignado a una, técnico, master y `anon`. Dueño de A ve su equipo, no
  el de B; B no ve el de A; vendedor asignado a A ve el de A, no ve el
  de B (no asignado ahí); master ve ambos; `anon` no ve nada (sin
  política); `customer` intenta insertar y choca con
  `insufficient_privilege`.
  **Hallazgo esperado, no un fallo:** el técnico todavía no ve ningún
  equipo — la subconsulta de `owned_equipment_read` que revisa
  `maintenance_requests.technician_id = auth.uid()` corre con los
  privilegios de quien pregunta, y `maintenance_requests` sigue sin
  ninguna política (RLS habilitada, bloqueada por completo) hasta el
  paso 3.2. Documentado y verificado como comportamiento esperado en
  esta secuencia, no un defecto de `owned_equipment_read`. Limpieza
  completa confirmada con `count(*)`.
- **Archivos:**
  `packages/db/migrations/20260809140000_owned_equipment_rls_policies.sql`
  (nuevo).
- **Resultado:** verificación OK. Cierra el paso 3.1. Sigue el 3.2
  (`maintenance_requests`) — al abrir esa política, la lectura del
  técnico en `owned_equipment` empieza a funcionar sin tocar esta
  migración.
- **Commit:** `feat(db): políticas RLS de owned_equipment — empresa, vendedor asignado, master`

## Bloqueos

- **R2 sin empezar:** bloquea servir manuales/adjuntos/firma real
  (`docs/11-STORAGE-R2.md`). No bloquea el resto de la fase — se muestra
  "pendiente de sincronización", mismo criterio que la factura en Fase 3.
- **Resend sin dominio verificado:** bloquea notificaciones por correo en
  cambios de estado (`progress/TODO.md`). Fuera de alcance de esta fase.

## Pendientes descubiertos

Ninguno todavía.
