# TAREA: Fase 3 — Comercio (parte D: bitácora continuación, bloqueos, pendientes)

Parte A (plan): [`ACTIVE-fase-3-comercio-A.md`](./ACTIVE-fase-3-comercio-A.md)
Parte B (bitácora, pasos 1.1–3.6): [`ACTIVE-fase-3-comercio-B.md`](./ACTIVE-fase-3-comercio-B.md)
Parte C (bitácora, pasos 4.1–6.3): [`ACTIVE-fase-3-comercio-C.md`](./ACTIVE-fase-3-comercio-C.md)

## Bitácora (continuación)

### 2026-08-08 — paso 7.1 (checkout directo bajo el umbral)

- **Hecho:** `packages/core/src/commerce/checkout.ts` —
  `checkoutDirectItems(client, items, ctx)`: crea `orders` +
  `order_items` directo, sin pasar por `quotes`, `status` queda en
  `pending_payment` (default del esquema, ninguna función lo toca —
  solo el webhook de Wompi lo cambiará en el paso 7.3). Mismo cálculo
  de subtotal/impuesto(19%)/total por línea que `request-quote.ts` y
  `accept-quote.ts`. Exportado desde `packages/core/src/index.ts`.
  `checkoutDirectItemsAction()` en
  `apps/web/app/(commerce)/carrito/actions.ts` — mismo patrón que
  `requestQuoteFromCartAction`: lee el carrito, separa por umbral
  (lectura de `settings.quote_threshold_cop` vía `service_role`, igual
  que ya se hace en la página del carrito), toma los `directItems`,
  llama `checkoutDirectItems`, borra esos `cart_items`, redirige a
  `/carrito?ordered=1` (no a `/pedidos` — todavía no existe, mismo
  criterio ya aplicado en `acceptQuoteAction`). Botón "Comprar" en
  `/carrito` bajo la sección "Compra directa", visible solo si
  `directItems.length > 0`.
- **Verificación:** `pnpm typecheck` y `pnpm lint` verdes en los 7
  paquetes. Verificación real vía `execute_sql` (proyecto no
  alcanzable por red desde este entorno): usuario/empresa/producto de
  prueba reales, `set local role authenticated` simulando la sesión
  del cliente — inserta `cart_items`, luego `orders`+`order_items`
  (confirma que `orders_insert` permite la compra directa igual que ya
  permite la creada desde una cotización aceptada) y borra el
  `cart_item` movido, todo con su propia sesión (sin necesitar
  `service_role` en ningún punto de este paso, a diferencia de
  `acceptQuote`). Verificado después: `orders.status = 'pending_payment'`,
  `1` `order_item` con los valores correctos, `0` `cart_items`
  restantes. Limpieza completa confirmada con `count(*)` en todas las
  tablas de prueba (incluido `auth.users`).
- **Archivos:** `packages/core/src/commerce/checkout.ts` (nuevo),
  `packages/core/src/index.ts`,
  `apps/web/app/(commerce)/carrito/{actions.ts,page.tsx}`.
- **Resultado:** verificación OK. Cierra el paso 7.1. Sigue el 7.2
  (iniciar transacción con `WompiMockClient`).
- **Commit:** `feat(web): checkoutDirectItems — compra directa bajo el umbral crea pedido pending_payment`

### 2026-08-08 — paso 7.2 (iniciar transacción con WompiMockClient)

- **Hecho:** `packages/core/src/commerce/initiate-payment.ts` —
  `initiateOrderPayment(wompiClient, { orderNumber, totalCop })`: llama
  `wompiClient.createTransaction(order_number, total_cop)` y devuelve
  `{ transactionId, reference }`. La referencia es el `order_number`
  (único en el esquema) — así el webhook (paso 7.3) va a poder volver a
  encontrar el pedido sin inventar un mapeo aparte. **No escribe en
  `payments`**: esa tabla la escribe solo el webhook (`service_role`),
  confirmado también con la prueba real de este paso. Recibe el
  `WompiClient` ya armado (no importa la clase concreta), así
  `packages/core` depende solo del contrato, no de `WompiMockClient`
  directamente.
  `checkoutDirectItemsAction()` en
  `apps/web/app/(commerce)/carrito/actions.ts` ahora, después de crear
  el pedido y vaciar los `cart_items` movidos, lee `order_number`/
  `total_cop` del pedido recién creado (con la propia sesión —
  `orders_read` ya lo permite) e inicia la transacción con
  `WompiMockClient`. El secreto real (`WOMPI_EVENTS_SECRET`) sigue sin
  existir (`PENDIENTE-DECISIÓN`); mientras tanto se usa un secreto de
  desarrollo fijo (`DEV_WOMPI_EVENTS_SECRET`) documentado en el propio
  archivo — se reemplaza por el real sin tocar el resto del código el
  día que exista. Redirige a `/carrito?ordered=1&ref=<referencia>`; la
  página muestra "estamos confirmando tu pago" (nunca "pago exitoso" —
  eso lo decide el webhook, paso 7.3).
  Se agregó `@tecni/integrations` como dependencia de `packages/core` y
  de `web` (primera vez que un cliente mock se instancia fuera de
  `packages/integrations`).
- **Verificación:** `pnpm typecheck`/`pnpm lint` verdes en los 7
  paquetes. Pruebas unitarias nuevas de `initiateOrderPayment` (2,
  referencia = `order_number`, determinismo del `transactionId`) +
  las 9 de `@tecni/integrations` y las 19 anteriores de `@tecni/core`,
  todas verdes (21/21 en core). Verificación real vía `execute_sql`:
  pedido creado con `set local role authenticated` (misma sesión que
  usaría la Server Action), lectura del `order_number` recién insertado
  con esa misma sesión (confirma que no hace falta `service_role` para
  este paso), `orders.status` sigue `pending_payment`, y **`payments`
  sigue en cero filas** — confirma que iniciar la transacción no
  escribe nada en `payments` todavía, eso es exclusivo del webhook.
  Limpieza completa confirmada con `count(*)`.
- **Archivos:** `packages/core/src/commerce/{initiate-payment.ts,
  initiate-payment.test.ts}`, `packages/core/src/index.ts`,
  `packages/core/package.json`, `apps/web/package.json`,
  `apps/web/app/(commerce)/carrito/{actions.ts,page.tsx}`.
- **Resultado:** verificación OK. Cierra el paso 7.2. Sigue el 7.3
  (webhook `/api/v1/webhooks/wompi` — riesgoso, verificación de firma
  obligatoria).
- **Commit:** `feat(web): initiateOrderPayment — inicia transacción con WompiMockClient tras el checkout directo`

### 2026-08-08 — paso 7.3 (webhook /api/v1/webhooks/wompi — riesgoso)

- **Hecho:** `packages/core/src/commerce/process-wompi-webhook.ts` —
  `processWompiWebhookEvent(serviceClient, event, eventsSecret)`:
  recalcula el checksum con `computeWompiChecksum` (mismo algoritmo
  compartido con `WompiMockClient.simulateApprovedEvent`, nunca
  reimplementado dos veces) **antes de tocar la base** — firma inválida
  devuelve `outcome: 'invalid_signature'` sin ninguna consulta. Si la
  firma es válida, busca el pedido por `order_number = transaction.reference`
  (`unknown_order` si no existe), inserta en `payments` (`provider_ref`
  = id de la transacción), y si el evento es `APPROVED` actualiza
  `orders.status = 'paid'`. El reintento del mismo evento choca contra
  `unique (provider, provider_ref)` del esquema — capturado como código
  `23505` y devuelto como `outcome: 'duplicate_event'`, sin volver a
  tocar `orders` (idempotencia real, no solo documentada).
  `apps/web/app/api/v1/webhooks/wompi/route.ts` (`POST`) — valida la
  forma mínima del body (rechaza JSON inválido o campos faltantes con
  400 antes de siquiera llamar a `processWompiWebhookEvent`), usa
  **siempre `createServiceRoleClient`** (nunca la sesión del usuario —
  esta ruta no tiene usuario, la llama Wompi), responde `401` en firma
  inválida, `404` si el pedido no existe, `200` en cualquier otro caso
  (procesado o duplicado — Wompi no debe reintentar por esto).
  Se extrajo `WOMPI_DEV_EVENTS_SECRET` a
  `packages/integrations/src/wompi/dev-secret.ts` (antes vivía duplicado
  como constante local en `carrito/actions.ts`) — ahora lo comparten
  quien inicia la transacción y quien verifica el webhook; si no
  coincidieran, ninguna firma de prueba pasaría nunca.
- **Verificación:** `pnpm typecheck`/`pnpm lint` verdes en los 7
  paquetes. 5 pruebas unitarias nuevas de `processWompiWebhookEvent`
  con un fake mínimo de `SupabaseClient` (firma inválida no toca la
  base, pedido inexistente se descarta, evento aprobado inserta el pago
  y marca `paid`, reintento del mismo evento es idempotente, el
  checksum compartido produce un sha256 real) — 26/26 en
  `@tecni/core`. Verificación real vía `execute_sql` (proyecto no
  alcanzable por red desde este entorno): con `set local role
  authenticated` un intento de insertar en `payments` falla con
  `insufficient_privilege` (reconfirma 3.4, acotado a este pedido);
  como `service_role` (lo que hace la ruta real) el insert en
  `payments` y el update de `orders.status = 'paid'` funcionan; un
  segundo insert con el mismo `(provider, provider_ref)` choca con
  `unique_violation` — es exactamente el código que
  `processWompiWebhookEvent` captura como evento duplicado. Limpieza
  completa confirmada con `count(*)`.
- **Archivos:** `packages/core/src/commerce/{process-wompi-webhook.ts,
  process-wompi-webhook.test.ts}`, `packages/core/src/index.ts`,
  `packages/integrations/src/wompi/dev-secret.ts`,
  `packages/integrations/src/index.ts`,
  `apps/web/app/api/v1/webhooks/wompi/route.ts`,
  `apps/web/app/(commerce)/carrito/actions.ts` (usa el secreto
  compartido en vez de la constante local).
- **Resultado:** verificación OK. Cierra el paso 7.3 (el más riesgoso
  de la fase — firma verificada de verdad, nunca desactivada, ni
  siquiera en el mock). Sigue el 7.4 (confirmación visible al cliente
  tras el pago).
- **Commit:** `feat(web): webhook /api/v1/webhooks/wompi — verifica firma, marca pedidos como paid`

### 2026-08-08 — paso 7.4 (confirmación visible al cliente tras el pago)

- **Hecho:** `apps/web/app/(commerce)/pedidos/confirmacion/page.tsx`
  (`?ref=<order_number>`) — lee el pedido real por `order_number` con la
  sesión del cliente (`orders_read` ya lo limita a su propia empresa,
  sin filtro adicional en la query), y muestra el mensaje según
  `orders.status` real: `pending_payment` → "estamos confirmando tu
  pago" (nunca "pago exitoso" antes de tiempo, tal como exige
  `09-INTEGRATION-PAYMENTS.md` sección 2 paso 5), `paid` → confirmación
  real, `cancelled` → mensaje de cancelado. Enlace "Actualizar estado"
  (recarga la misma página — sin WebSocket/polling, fuera de alcance de
  esta fase) mientras el pedido sigue `pending_payment`. `total_cop` y
  fecha visibles. `checkoutDirectItemsAction` ahora redirige acá
  (`/pedidos/confirmacion?ref=<order_number>`) en vez de a
  `/carrito?ordered=1` — se quitó ese banner muerto de `/carrito`
  (nunca iba a mostrar el estado real, era un mensaje fijo).
- **Verificación:** `pnpm typecheck`/`pnpm lint` verdes en los 7
  paquetes. Verificación real vía `execute_sql`: dos empresas reales,
  pedido de la empresa A en `paid` — con la sesión de A,
  `orders_read` deja verlo con su `status` real (`paid`); con la
  sesión de B, el mismo `order_number` no devuelve filas (RLS por
  `company_id`, no por conocer o no la referencia). Limpieza completa
  confirmada con `count(*)`.
- **Archivos:** `apps/web/app/(commerce)/pedidos/confirmacion/page.tsx`
  (nuevo), `apps/web/app/(commerce)/carrito/{actions.ts,page.tsx}`.
- **Resultado:** verificación OK. **Cierra el paso 7.4 y la Fase 7
  completa** (checkout directo → transacción con `WompiMockClient` →
  webhook con firma verificada → confirmación real al cliente). Sigue
  la Fase 8 (pedidos, envío, factura).
- **Commit:** `feat(web): confirmación de pedido tras el pago — lee el estado real de orders.status`

### 2026-08-08 — paso 8.1 (estados de pedido + vista de detalle)

- **Hecho:** `apps/web/app/(commerce)/pedidos/page.tsx` — lista de
  pedidos de la empresa (`orders_read` ya la limita), estado en
  español (`ORDER_STATUS_LABEL`, exportado para reusar en el detalle:
  `pending_payment`/`paid`/`preparing`/`shipped`/`delivered`/
  `cancelled`), total y fecha, cada uno enlaza a su detalle.
  `apps/web/app/(commerce)/pedidos/[orderNumber]/page.tsx` — detalle
  real: productos (`order_items`), subtotal/impuesto/envío/total,
  estado. Sin envío (`shipments`, paso 8.2) ni factura
  (`invoice_pdf_r2_key`, paso 8.3) todavía — no se fabrica esa sección
  antes de construirla, mismo criterio que ya se aplicó en `/carrito`
  (5.3) y `acceptQuoteAction` (6.3).
- **Verificación:** `pnpm typecheck`/`pnpm lint` verdes en los 7
  paquetes. Verificación real vía `execute_sql`: dos empresas, empresa
  A con 2 pedidos reales (uno con `order_items`) — con la sesión de A
  se ven los 2 pedidos y el `order_item` del primero; con la sesión de
  B, el mismo `order_number` de A no devuelve ninguna fila (RLS por
  `company_id`, no por conocer o no la referencia — mismo patrón ya
  probado en 7.4, ahora extendido a la lista completa y no solo a un
  pedido). Limpieza completa confirmada con `count(*)`.
- **Archivos:** `apps/web/app/(commerce)/pedidos/page.tsx` (nuevo),
  `apps/web/app/(commerce)/pedidos/[orderNumber]/page.tsx` (nuevo).
- **Resultado:** verificación OK. Cierra el paso 8.1. Sigue el 8.2
  (carga manual de guía de envío).
- **Commit:** `feat(web): lista y detalle de pedidos — estados reales, RLS por empresa`

### 2026-08-08 — paso 8.2 (carga manual de guía de envío)

- **Hecho:** `packages/core/src/commerce/upload-shipment.ts` —
  `uploadShipment(client, input, ctx)`: inserta en `shipments`
  (`created_by = ctx.userId`, `shipped_at = now()`), valida que la
  transportadora no venga vacía antes de tocar la base. No cambia
  `orders.status` — el estado del pedido lo mueve el vendedor por
  separado (fuera de alcance de este paso, ya lo permite
  `orders_update_staff`).
  `apps/web/app/(staff)/ventas/pedidos/{page.tsx,actions.ts,
  [orderNumber]/page.tsx}` — primer uso real del prefijo `/ventas`
  (protegido por el middleware para `seller`/`master`,
  `06-AUTH-ROLES.md` sección 5, ya existía pero sin ninguna página).
  Lista de pedidos visibles con la sesión de staff (`orders_read` los
  limita a asignados o todos si es `master` — sin asignación de
  vendedor todavía, `panel de vendedor completo` sigue fuera de
  alcance de esta fase), detalle con formulario para cargar
  transportadora/número de guía/enlace de rastreo/notas. La vista de
  pedido del cliente
  (`apps/web/app/(commerce)/pedidos/[orderNumber]/page.tsx`) ahora
  también muestra la guía una vez cargada (`shipments_read` ya la
  limita a la propia empresa) — cierra el ciclo: el vendedor carga, el
  cliente ve.
- **Verificación:** `pnpm typecheck`/`pnpm lint` verdes en los 7
  paquetes. 3 pruebas unitarias nuevas de `uploadShipment` (registra
  con los datos correctos, rechaza transportadora vacía sin llegar a
  la base, propaga error de la base) — 29/29 en `@tecni/core`.
  Verificación real vía `execute_sql`: `customer` intenta insertar en
  `shipments` y choca con `insufficient_privilege`
  (`shipments_write_staff` exige `seller`/`master`, confirmado con
  datos reales); `seller` sí puede cargar la guía; el dueño del pedido
  la ve (`shipments_read`); una empresa distinta no ve nada. Limpieza
  completa confirmada con `count(*)`.
- **Archivos:** `packages/core/src/commerce/{upload-shipment.ts,
  upload-shipment.test.ts}`, `packages/core/src/index.ts`,
  `apps/web/app/(staff)/ventas/pedidos/{page.tsx,actions.ts,
  [orderNumber]/page.tsx}`,
  `apps/web/app/(commerce)/pedidos/[orderNumber]/page.tsx`.
- **Resultado:** verificación OK. Cierra el paso 8.2. Sigue el 8.3
  (factura visible — sin R2 real todavía).
- **Commit:** `feat(web): carga manual de guía de envío desde /ventas/pedidos, visible en el pedido del cliente`

### 2026-08-08 — paso 8.3 (factura visible — sin R2 todavía)

- **Hecho:** `apps/web/app/(commerce)/pedidos/[orderNumber]/page.tsx` —
  sección "Factura", visible solo cuando `orders.status` ya no es
  `pending_payment` ni `cancelled` (no hay nada que facturar antes de
  un pago confirmado). Muestra `siigo_invoice_id` si existe, o
  "pendiente de sincronización con Siigo" si es `null` (siempre lo va
  a ser mientras no exista la sincronización real con Siigo — sin
  fabricar un consecutivo). El PDF se muestra siempre como "pendiente
  de sincronización" — **texto, nunca un enlace** — porque
  `docs/11-STORAGE-R2.md` no tiene ni una línea de código todavía; ni
  siquiera si `invoice_pdf_r2_key` tuviera un valor se podría generar
  un enlace firmado real.
- **Verificación:** `pnpm typecheck`/`pnpm lint` verdes en los 7
  paquetes. Verificación real vía `execute_sql`: dos pedidos reales de
  la misma empresa, uno con `siigo_invoice_id` puesto y otro sin —
  leídos con la sesión del dueño, el primero devuelve el número real,
  el segundo `null` (confirma que la página va a mostrar el texto de
  "pendiente" exactamente cuando corresponde, no como adorno).
  Limpieza completa confirmada con `count(*)`.
- **Archivos:** `apps/web/app/(commerce)/pedidos/[orderNumber]/page.tsx`.
- **Resultado:** verificación OK. **Cierra el paso 8.3 y la Fase 8
  completa** (estados de pedido, detalle, envío manual, factura sin
  fabricar nada que no existe). Sigue la Fase 9 (`/mi-cuenta`).
- **Commit:** `feat(web): sección de factura en el detalle de pedido — pendiente de sincronización mientras no haya Siigo/R2`

## Bloqueos

- **Credenciales de Siigo/Wompi:** bloqueante de `progress/TODO.md`, no
  bloquea esta tarea (se usan `SiigoMockClient`/`WompiMockClient`).
- **Inventario real:** sigue bloqueante en `progress/TODO.md`, no bloquea
  esta tarea (datos de prueba, mismo patrón de la Fase 2).
- **R2 sin empezar:** bloquea solo la parte de PDF de factura real (paso
  8.3), no el resto de la fase.

## Pendientes descubiertos

Ninguno todavía.
