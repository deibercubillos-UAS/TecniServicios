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

## Bloqueos

- **Credenciales de Siigo/Wompi:** bloqueante de `progress/TODO.md`, no
  bloquea esta tarea (se usan `SiigoMockClient`/`WompiMockClient`).
- **Inventario real:** sigue bloqueante en `progress/TODO.md`, no bloquea
  esta tarea (datos de prueba, mismo patrón de la Fase 2).
- **R2 sin empezar:** bloquea solo la parte de PDF de factura real (paso
  8.3), no el resto de la fase.

## Pendientes descubiertos

Ninguno todavía.
