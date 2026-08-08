# TAREA: Fase 3 — Comercio (parte B: bitácora, bloqueos, pendientes)

Parte A (plan): [`ACTIVE-fase-3-comercio-A.md`](./ACTIVE-fase-3-comercio-A.md)

## Bitácora

### 2026-08-08 — paso 1.1 (docs/13-MODULE-COMMERCE.md)

- **Hecho:** escrito `docs/13-MODULE-COMMERCE.md` — alcance (v1 sin
  carrito anónimo), regla del umbral repetida de `CLAUDE.md` (nunca
  hardcodeada, `settings.quote_threshold_cop`), carrito (un carrito por
  empresa, precio congelado con `resolvePrice()` al agregar), flujo de
  cotización completo (solicitud sin vendedor asignado todavía → Siigo
  cotiza, la web no genera consecutivos → aceptación crea pedido),
  checkout (el webhook de Wompi es la única fuente de verdad de que un
  pago se completó, nunca el cliente ni el redirect), estados de
  pedido, guía manual, factura (sin R2 todavía, "pendiente de
  sincronización" en vez de un enlace fabricado), dashboard del
  cliente, matriz de roles de esta fase. No repite el esquema
  (`04-DATABASE-SCHEMA-B.md` sección 5 ya lo tiene completo) ni el
  contrato de Wompi (paso 1.2, sección aparte).
- **Archivos:** `docs/13-MODULE-COMMERCE.md` (nuevo, 136 líneas),
  `docs/00-INDEX.md` (estado 13 → ✅).
- **Resultado:** verificación OK, bajo el límite de 500 líneas.
- **Commit:** `docs(commerce): agrega 13-MODULE-COMMERCE.md`

### 2026-08-08 — paso 1.2 (docs/09-INTEGRATION-PAYMENTS.md)

- **Hecho:** escrito `docs/09-INTEGRATION-PAYMENTS.md` — estado
  `PENDIENTE-DECISIÓN` con la tabla de variables de entorno (todas ya
  existían `.optional()` en `env.ts` desde la Fase 0), flujo completo
  (pedido creado antes de mandar a pagar, firma de integridad al
  iniciar, **el webhook es la única fuente de verdad, nunca el
  redirect**, verificación de firma obligatoria sin excepción ni en
  desarrollo, `payments` como historial inmutable con `unique
  (provider, provider_ref)` evitando duplicados de reintentos),
  conciliación, reembolsos marcados explícitamente como
  `PENDIENTE-DECISIÓN` de negocio (no se improvisa un flujo sin que el
  negocio lo defina), contrato de `WompiMockClient` (mismo patrón que
  `SiigoMockClient` — incluye `simulateApprovedEvent` que firma el
  payload de verdad, para poder probar el webhook completo sin
  desactivar la verificación de firma en ningún punto).
- **Archivos:** `docs/09-INTEGRATION-PAYMENTS.md` (nuevo, 95 líneas),
  `docs/00-INDEX.md` (estado 09 → ✅).
- **Resultado:** verificación OK, bajo el límite de 500 líneas. Falta
  1.3 (sección RLS de comercio) para cerrar la Fase 1 de la tarea.
- **Commit:** `docs(payments): agrega 09-INTEGRATION-PAYMENTS.md`

### 2026-08-08 — paso 1.3 (sección RLS de comercio)

- **Hecho:** agregada la sección "Comercio" a `05-RLS-SECURITY.md` con
  las 8 tablas: `carts`/`cart_items` (dueño de la empresa, sin
  carrito anónimo en v1 — `13-MODULE-COMMERCE.md` sección 1),
  `quotes`/`quote_items` (empresa + vendedor asignado + master, el
  cliente nunca actualiza su propia cotización — repite el patrón que
  ya existía documentado genéricamente, ahora completo con
  `quote_items`), `orders`/`order_items` (mismo patrón, con la
  distinción de que el cliente **sí** puede insertar su propio pedido
  — checkout directo o aceptar cotización corren con su sesión, a
  diferencia de `quotes_insert` que exige rol `seller`/`master`),
  `payments` (**sin ninguna política de escritura para
  `authenticated`** — solo `service_role` desde el webhook, la única
  tabla de esta fase donde ni el vendedor puede escribir directo),
  `shipments` (lectura empresa, escritura solo vendedor/master). Nota
  final marcando `orders_insert` como la única excepción de "el
  cliente escribe una tabla de comercio directo" en toda la fase.
  **Hallazgo del propio paso: el archivo pasó de 387 a 521 líneas** —
  rompe la regla de oro 1 de `CLAUDE.md` (ningún `.md` supera 500
  líneas). Dividido en `05-RLS-SECURITY-A.md` (secciones 1–4: postura,
  reglas absolutas, problema de los precios, políticas por tabla
  completas — incluida la nueva sección de comercio) y
  `05-RLS-SECURITY-B.md` (secciones 5–10: almacenamiento, autenticación,
  cabeceras, datos personales, checklist, pruebas de RLS) — el único
  punto de corte válido según la regla ("no se parte a mitad de una
  sección: la división respeta encabezados de nivel 2") es justo antes
  de "## 5. Almacenamiento", así que quedó desbalanceado (442/85
  líneas) pero es el único corte que no parte una sección `##` por la
  mitad. Actualizadas **todas** las referencias cruzadas en docs vivos
  (`04-DATABASE-SCHEMA-A.md`, `04-DATABASE-SCHEMA-B.md`,
  `06-AUTH-ROLES.md`, `12-MODULE-CATALOG.md`, `13-MODULE-COMMERCE.md`,
  `18-TESTING.md`, `19-DEPLOYMENT.md`, `21-ROADMAP.md`, `00-INDEX.md`,
  `CLAUDE.md`, este mismo plan) apuntando a `-A` o `-B` según la
  sección real que citaban. Las referencias dentro de `docs/tasks/done/`
  (bitácoras cerradas) se dejaron intactas — son registro histórico, no
  documentación viva; reescribirlas sería alterar el historial de lo
  que realmente se hizo en su momento.
- **Archivos:** `docs/05-RLS-SECURITY-A.md` (nuevo, 442 líneas),
  `docs/05-RLS-SECURITY-B.md` (nuevo, 85 líneas), `docs/05-RLS-SECURITY.md`
  (eliminado), `docs/00-INDEX.md`, `docs/04-DATABASE-SCHEMA-A.md`,
  `docs/04-DATABASE-SCHEMA-B.md`, `docs/06-AUTH-ROLES.md`,
  `docs/12-MODULE-CATALOG.md`, `docs/13-MODULE-COMMERCE.md`,
  `docs/18-TESTING.md`, `docs/19-DEPLOYMENT.md`, `docs/21-ROADMAP.md`,
  `docs/progress/DECISIONS.md`, `CLAUDE.md`,
  `docs/tasks/ACTIVE-fase-3-comercio-A.md`.
- **Resultado:** verificación OK. Ambos archivos nuevos bajo el límite
  de 500 líneas. **Cierra la Fase 1 (documentación) de la tarea.**
- **Commit:** `docs(rls): sección de comercio en 05-RLS-SECURITY; divide el doc en A/B por el límite de 500 líneas`

### 2026-08-08 — paso 2.1 (enums de comercio)

- **Hecho:** verificado primero que no existían (`pg_type`, consulta
  vacía) — aplicados `quote_status`/`order_status`/`payment_status`
  vía `apply_migration`, exactos a `04-DATABASE-SCHEMA-A.md`.
  `maintenance_status`/`ticket_status`/`ticket_priority` (postventa,
  sección 6) quedan para su fase, no se adelantan.
- **Archivos:**
  `packages/db/migrations/20260808210000_create_commerce_enums.sql`.
- **Resultado:** verificación OK. `get_advisors` re-corrido: misma
  base ya conocida y justificada, nada nuevo. Los 3 enums verificados
  con sus etiquetas exactas en el orden documentado
  (`pg_enum.enumsortorder`).
- **Commit:** `feat(db): enums de comercio (quote_status, order_status, payment_status)`

### 2026-08-08 — paso 2.2 (migración carts + cart_items)

- **Hecho:** aplicada `create_carts_and_cart_items` vía
  `apply_migration`, exacta a `04-DATABASE-SCHEMA-B.md` sección 5. RLS
  habilitada en ambas, sin políticas.
- **Archivos:**
  `packages/db/migrations/20260808220000_create_carts_and_cart_items.sql`.
- **Resultado:** verificación OK. `relrowsecurity = true`,
  `policy_count = 0` en ambas.
- **Commit:** `feat(db): migración carts y cart_items con RLS bloqueada`

### 2026-08-08 — paso 2.3 (migración quotes + quote_items)

- **Hecho:** aplicada `create_quotes_and_quote_items` vía
  `apply_migration`, exacta a `04-DATABASE-SCHEMA-B.md` sección 5. RLS
  habilitada en ambas, sin políticas.
- **Archivos:**
  `packages/db/migrations/20260808230000_create_quotes_and_quote_items.sql`.
- **Resultado:** verificación OK. `relrowsecurity = true`,
  `policy_count = 0` en ambas.
- **Commit:** `feat(db): migración quotes y quote_items con RLS bloqueada`

### 2026-08-08 — paso 2.4 (migración orders + order_items)

- **Hecho:** aplicada `create_orders_and_order_items` vía
  `apply_migration`, exacta a `04-DATABASE-SCHEMA-B.md` sección 5. RLS
  habilitada en ambas, sin políticas.
- **Archivos:**
  `packages/db/migrations/20260808240000_create_orders_and_order_items.sql`.
- **Resultado:** verificación OK. `relrowsecurity = true`,
  `policy_count = 0` en ambas.
- **Commit:** `feat(db): migración orders y order_items con RLS bloqueada`

### 2026-08-08 — paso 2.5 (migración payments)

- **Hecho:** aplicada `create_payments` vía `apply_migration`, exacta a
  `04-DATABASE-SCHEMA-B.md` sección 5 (incluido el índice único
  parcial `(provider, provider_ref) where provider_ref is not null`,
  que evita duplicados si Wompi reintenta el mismo evento de webhook).
  RLS habilitada, sin políticas.
- **Archivos:**
  `packages/db/migrations/20260808250000_create_payments.sql`.
- **Resultado:** verificación OK. `relrowsecurity = true`,
  `policy_count = 0`.
- **Commit:** `feat(db): migración payments con RLS bloqueada`

### 2026-08-08 — paso 2.6 (migración shipments)

- **Hecho:** aplicada `create_shipments` vía `apply_migration`, exacta
  a `04-DATABASE-SCHEMA-B.md` sección 5. RLS habilitada, sin
  políticas. Cierra el esquema completo de la Fase 2 de la tarea —
  falta 2.7 (`get_advisors` de cierre) para pasar a la Fase 3 (RLS).
- **Archivos:**
  `packages/db/migrations/20260808260000_create_shipments.sql`.
- **Resultado:** verificación OK. `relrowsecurity = true`,
  `policy_count = 0`.
- **Commit:** `feat(db): migración shipments con RLS bloqueada`

### 2026-08-08 — paso 2.7 (get_advisors de cierre de Fase 2)

- **Hecho:** corrido `get_advisors` (tipo `security`) tras el esquema
  completo de comercio. Resultado: 11 INFO `rls_enabled_no_policy`
  (8 tablas nuevas — `carts`/`cart_items`/`quotes`/`quote_items`/
  `orders`/`order_items`/`payments`/`shipments` — esperado, se cierran
  en la Fase 3 de la tarea; más `product_documents`/`settings`, ya
  conocidas de fases anteriores), el ERROR de `public_products` ya
  justificado, los 2 WARN de `auth_role`/`auth_company_ids` ya
  justificados. Nada nuevo sin explicar.
- **Archivos:** ninguno (paso de solo lectura).
- **Resultado:** verificación OK. **Cierra la Fase 2 (esquema) de la
  tarea** — las 8 tablas de comercio existen con RLS habilitada y
  bloqueada. Sigue la Fase 3 (abrir las políticas RLS reales).
- **Commit:** N/A (sin cambios de archivo, solo bitácora)

### 2026-08-08 — paso 3.1 (políticas RLS de carts/cart_items)

- **Hecho:** aplicadas `carts_owner`/`cart_items_owner`, exactas a
  `05-RLS-SECURITY-A.md` sección "Comercio". Prueba de aislamiento
  real con dos empresas reales (`companies` + `profiles` +
  `company_members`, `auth.users` reales — no mocks): empresa A y B,
  cada una con un carrito. Rol `authenticated` real con
  `request.jwt.claims` simulando el JWT de A (`set local role
  authenticated`, mismo patrón de la Fase 1). Asserts (`raise
  exception` si fallan, silencio = todo pasó): (1) A ve exactamente 1
  carrito (el suyo); (2) A no ve el carrito de B; (3) A no puede
  insertar un `cart_item` en el carrito de B — bloqueado por RLS.
  **Hallazgo del propio test:** `insert into profiles (id, ...)` falló
  con clave duplicada — el trigger `handle_new_user` (Fase 1) ya crea
  la fila de `profiles` al insertar en `auth.users`, así que el setup
  de la prueba usa `update`, no `insert`, para completar
  `full_name`/`role`. No es un bug del esquema, es el comportamiento
  esperado del trigger — quedó documentado acá para que la próxima
  prueba de este estilo no repita el mismo tropiezo.
- **Archivos:**
  `packages/db/migrations/20260808270000_carts_rls_policies.sql`.
- **Resultado:** verificación OK. `get_advisors` re-corrido:
  `carts`/`cart_items` salen de la lista `rls_enabled_no_policy`, el
  resto de hallazgos sigue siendo el mismo ya justificado. Sin
  residuos de prueba (`companies`/`auth.users`/`carts` de prueba
  eliminados, confirmado con `count`).
- **Commit:** `feat(db): políticas RLS de carts y cart_items con prueba real de dos empresas`

### 2026-08-08 — paso 3.2 (políticas RLS de quotes/quote_items)

- **Hecho:** aplicadas `quotes_read`/`quotes_insert`/
  `quotes_update_staff`/`quote_items_read`/`quote_items_write_staff`,
  exactas a `05-RLS-SECURITY-A.md`. Prueba real con dos empresas +
  vendedor (`auth.users` reales, JWT simulado por usuario, mismo
  patrón del paso 3.1). Asserts: (1) B no puede crear una cotización
  para la empresa de A; (2) B no ve la cotización de A; (3) A (cliente)
  no puede cambiar el `status` de su propia cotización — la regla de
  `13-MODULE-COMMERCE.md` sección 4 ("el cliente nunca edita `status`")
  quedó probada contra RLS real, no solo escrita; (4) un vendedor **sin
  asignar** (`seller_id` distinto) tampoco puede actualizarla; (5) una
  vez asignado (`seller_id = auth.uid()`), el vendedor sí puede
  cambiar el `status`; (6) el vendedor asignado inserta `quote_items`,
  el cliente no puede; (7) el cliente sí puede leer los ítems de su
  propia cotización. Los 7 asserts pasaron sin excepción.
- **Archivos:**
  `packages/db/migrations/20260808280000_quotes_rls_policies.sql`.
- **Resultado:** verificación OK. `get_advisors` re-corrido:
  `quotes`/`quote_items` salen de `rls_enabled_no_policy`, resto sin
  cambios. Sin residuos de prueba (confirmado con `count`).
- **Commit:** `feat(db): políticas RLS de quotes y quote_items con prueba real de vendedor asignado`

### 2026-08-08 — paso 3.3 (políticas RLS de orders/order_items)

- **Hecho:** aplicadas `orders_read`/`orders_insert`/
  `orders_update_staff`/`order_items_read`/`order_items_insert`,
  exactas a `05-RLS-SECURITY-A.md`. Diferencia clave con `quotes`: el
  cliente **sí** puede insertar su propio pedido (checkout directo o
  aceptar cotización corren con su sesión, sin exigir rol
  `seller`/`master` como en `quotes_insert`) — probado explícitamente.
  Prueba real con dos empresas + vendedor: (1) B no puede crear un
  pedido para la empresa de A; (2) B no ve el pedido de A; (3) A no
  puede marcar su propio pedido como pagado (`orders.status`); (4) un
  vendedor sin asignar tampoco puede; (5) el vendedor asignado sí
  puede actualizar `status`; (6) A inserta `order_items` en su propio
  pedido; (7) A no puede insertar `order_items` en el pedido de B. Los
  7 asserts pasaron sin excepción.
- **Archivos:**
  `packages/db/migrations/20260808290000_orders_rls_policies.sql`.
- **Resultado:** verificación OK. `get_advisors` re-corrido:
  `orders`/`order_items` salen de `rls_enabled_no_policy`, resto sin
  cambios. Sin residuos de prueba (confirmado con `count`).
- **Commit:** `feat(db): políticas RLS de orders y order_items con prueba real de checkout directo`

### 2026-08-08 — paso 3.4 (política RLS de payments)

- **Hecho:** aplicada `payments_read`, exacta a
  `05-RLS-SECURITY-A.md` — **una sola política, solo lectura**. Sin
  ninguna política de insert/update/delete para `authenticated`: es la
  única tabla de comercio donde ni el vendedor puede escribir directo,
  solo `service_role` desde el webhook (bypassa RLS por completo).
  Prueba real: (1) el dueño de la empresa lee su propio pago; (2) ese
  mismo usuario **no puede insertar** un pago directo — bloqueado por
  RLS aunque intente, no solo porque la UI no lo ofrezca; (3) tampoco
  puede actualizar el `status` de un pago existente (probado
  reintentando marcarlo `refunded`); (4) otra empresa no ve el pago.
  Los 4 asserts pasaron sin excepción.
- **Archivos:**
  `packages/db/migrations/20260808300000_payments_rls_policies.sql`.
- **Resultado:** verificación OK. `get_advisors` re-corrido: `payments`
  sale de `rls_enabled_no_policy`, resto sin cambios. Sin residuos de
  prueba (confirmado con `count`).
- **Commit:** `feat(db): política RLS de payments — solo lectura, sin escritura para authenticated`

## Bloqueos

- **Credenciales de Siigo/Wompi:** bloqueante de `progress/TODO.md`, no
  bloquea esta tarea (se usan `SiigoMockClient`/`WompiMockClient`).
- **Inventario real:** sigue bloqueante en `progress/TODO.md`, no bloquea
  esta tarea (datos de prueba, mismo patrón de la Fase 2).
- **R2 sin empezar:** bloquea solo la parte de PDF de factura real (paso
  8.3), no el resto de la fase.

## Pendientes descubiertos

Ninguno todavía.
