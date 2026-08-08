# TAREA: Fase 3 — Comercio (parte C: bitácora continuación, bloqueos, pendientes)

Parte A (plan): [`ACTIVE-fase-3-comercio-A.md`](./ACTIVE-fase-3-comercio-A.md)
Parte B (bitácora, pasos 1.1–3.6): [`ACTIVE-fase-3-comercio-B.md`](./ACTIVE-fase-3-comercio-B.md)

## Bitácora (continuación)

### 2026-08-08 — paso 4.1 (confirmación: settings.quote_threshold_cop)

- **Hecho:** verificado con `execute_sql` — el registro semilla ya
  existía (`key = 'quote_threshold_cop'`, `value = 5000000`),
  sembrado desde la Fase 0/1. Sin migración nueva, solo verificación.
- **Archivos:** ninguno.
- **Resultado:** verificación OK. El umbral real está en la base,
  listo para que `splitCartByThreshold()` (paso 5.1) lo lea.
- **Commit:** N/A (sin cambios de archivo, solo bitácora)

### 2026-08-08 — paso 4.2 (WompiMockClient)

- **Hecho:** `packages/integrations/src/wompi/{types.ts,checksum.ts,
  mock-client.ts}` — mismo patrón que `SiigoMockClient`
  (`createTransaction(reference, amountCop)` determinístico por hash
  FNV-1a de la referencia, sin red, `status: 'PENDING'`).
  `computeWompiChecksum()` (`node:crypto`, `sha256`) implementa el
  algoritmo real de Wompi documentado en `09-INTEGRATION-PAYMENTS.md`
  sección 2 — **compartido**, no reimplementado dos veces: el mock lo
  usa para firmar `simulateApprovedEvent()`, y el futuro webhook real
  lo va a usar para verificar. `simulateApprovedEvent(reference,
  amountCop)` arma un `WompiWebhookEvent` completo con firma válida,
  para poder probar la ruta del webhook de punta a punta (firma
  incluida) sin desactivar la verificación en ningún punto del código
  real. 5 pruebas unit reales: determinismo por referencia,
  referencias distintas dan transacciones distintas, conversión COP →
  centavos, la firma simulada valida contra el mismo secreto, y **no**
  valida contra un secreto distinto (prueba negativa real de que la
  verificación de firma hace algo, no solo que existe).
- **Archivos:**
  `packages/integrations/src/wompi/{types.ts,checksum.ts,mock-client.ts,
  mock-client.test.ts}`, `packages/integrations/src/index.ts`.
- **Resultado:** verificación OK. `typecheck`/`lint`/`test` verdes en
  el paquete (9/9, incluidas las 4 de `SiigoMockClient`); `pnpm
  typecheck`/`pnpm lint` en la raíz también, sin romper nada del resto
  del monorepo. **Cierra la Fase 4 (base para el checkout) de la
  tarea.**
- **Commit:** `feat(integrations): WompiMockClient con firma de webhook verificable`

### 2026-08-08 — paso 5.1 (splitCartByThreshold)

- **Hecho:** `packages/core/src/commerce/split-cart-by-threshold.ts` —
  función pura, compara `unitPriceCop` (**el precio del producto**,
  no el total de línea) contra el umbral: `< umbral` → compra
  directa, `>= umbral` → cotización. Documentado explícitamente que
  la cantidad no saca un producto del umbral (10 unidades de
  $600.000 c/u siguen siendo compra directa, aunque el total de línea
  sea $6.000.000) — coincide con la redacción de `CLAUDE.md` sección
  5.2 ("Producto < $5.000.000"), no con el total del carrito. 6
  pruebas unit reales, incluido el límite exacto (`= umbral` va a
  cotización, `umbral - 1` va a compra directa) y un carrito mixto de
  3 ítems.
- **Archivos:**
  `packages/core/src/commerce/{split-cart-by-threshold.ts,
  split-cart-by-threshold.test.ts}`, `packages/core/src/index.ts`.
- **Resultado:** verificación OK. `typecheck`/`lint`/`test` verdes en
  el paquete (19/19, incluidas las pruebas previas de
  `resolvePrice`/`catalog-sort`); `pnpm typecheck`/`pnpm lint` en la
  raíz también.
- **Commit:** `feat(core): splitCartByThreshold — la única función que decide compra directa vs. cotización`

### 2026-08-08 — paso 5.2 (Server Actions de carrito)

- **Hecho:** `packages/core/src/commerce/cart.ts` — `getOrCreateCartId`
  (un carrito por empresa, `carts_owner` de RLS ya restringe a la
  propia empresa, la función no repite esa validación), `addCartItem`
  (**congela** `unit_price_cop` vía `resolvePrice()` en el momento de
  agregar — nunca vuelve a leer `products.price_cop` después; si el
  mismo producto ya está en el carrito, **suma** la cantidad y
  **conserva** el precio ya congelado, no lo actualiza con el precio
  actual — agregar de nuevo no debe "refrescar" un precio congelado),
  `updateCartItemQuantity` (nunca toca el precio, solo cantidad),
  `removeCartItem`.
  `apps/web/app/(commerce)/carrito/actions.ts` — 3 Server Actions
  (`addToCartAction`/`updateCartItemQuantityAction`/
  `removeCartItemAction`), mismo patrón `redirect` con `error=`/
  parámetro de éxito en la URL que `contacto`/`registro`. La empresa
  del usuario se resuelve desde `company_members` (primero
  `is_primary`), no hay claim de empresa en el JWT.
- **Verificación:** `pnpm typecheck`/`pnpm lint` verdes en los 8
  paquetes (1 warning de import sin usar corregido antes de cerrar el
  paso). `pnpm --filter @tecni/core test`: 19/19. `pnpm --filter web
  build` verde (sin página `/carrito` todavía — 5.3 — así que la ruta
  no aparece en el build, esperado). Verificación real del flujo SQL
  equivalente (proyecto no alcanzable por red desde este entorno):
  empresa + usuario + producto reales, `set local role authenticated`
  con JWT simulado — creado el carrito, insertado un ítem, sumada la
  cantidad de un segundo "agregar" del mismo producto: precio se
  mantiene en `300000` (nunca se sobrescribe), cantidad final `5`
  (`2 + 3`). Sin residuos de prueba (confirmado con `count`).
- **Archivos:** `packages/core/src/commerce/cart.ts`,
  `packages/core/src/index.ts`, `apps/web/app/(commerce)/carrito/actions.ts`.
- **Resultado:** verificación OK. **Cierra el paso 5.2.** Falta 5.3
  (UI del carrito) para cerrar la Fase 5.
- **Commit:** `feat(web): Server Actions de carrito con precio congelado`

### 2026-08-08 — paso 5.3 (UI del carrito)

- **Hecho:** `apps/web/app/(commerce)/carrito/page.tsx` — server
  component: redirige a `/login?next=/carrito` sin sesión, resuelve
  la empresa vía `company_members`, trae el carrito y sus
  `cart_items` + los productos referenciados, usa
  `splitCartByThreshold()` (paso 5.1) para dividir en "Compra
  directa" / "Requiere cotización", con subtotal por sección y una
  nota explícita cuando hay ítems en cotización — la división queda
  **visible antes de pagar**, regla de negocio 5.2 de `CLAUDE.md`.
  Cada ítem tiene su formulario de actualizar cantidad/quitar,
  conectado a las Server Actions del paso 5.2. Sin CTA de "pagar" ni
  "solicitar cotización" todavía — esos flujos son las Fases 6 y 7 de
  esta tarea, no se fabrica un botón que no hace nada.
  **Hallazgo real durante la verificación:** `settings` no tiene
  ninguna política de RLS (bloqueada por completo desde la Fase 1) —
  ni siquiera `authenticated` puede leerla. La primera versión de esta
  página consultaba `quote_threshold_cop` con el cliente de sesión del
  usuario y caía silenciosamente al valor de respaldo hardcodeado
  (`5.000.000`, coincidencia con el valor real, no una garantía) —
  contradice directamente la decisión de `progress/DECISIONS.md`
  ("editable desde el panel maestro. Nunca hardcodeado"): si el master
  cambiara el umbral, la página seguiría usando el número fijo del
  código, no el real. Corregido leyendo el umbral con
  `createServiceRoleClient` — es configuración operativa, no un dato
  de usuario, mismo criterio que otras lecturas privilegiadas ya
  usadas en el proyecto (p. ej. `registro/actions.ts`).
- **Verificación:** `pnpm typecheck`/`pnpm lint` verdes en los 8
  paquetes. `pnpm --filter web build` verde (`/carrito` registrada).
  Servidor local: `307` a `/login?next=/carrito` sin sesión
  (confirmado el redirect real, no solo el código). Verificación real
  vía `execute_sql` (proyecto no alcanzable por red desde este
  entorno): `set local role authenticated` con un usuario simulado —
  `select count(*) from settings` devuelve `0` (confirma el hallazgo:
  RLS bloquea la lectura por completo); `set local role service_role`
  — sí devuelve el valor real (`5000000`), confirma que el fix
  funciona.
- **Archivos:** `apps/web/app/(commerce)/carrito/page.tsx`.
- **Resultado:** verificación OK. **Cierra el paso 5.3 y la Fase 5
  completa** (carrito con división por umbral, precio congelado,
  agregar/quitar/actualizar). Sigue la Fase 6 (cotización).
- **Commit:** `feat(web): UI del carrito con división por umbral (settings leído vía service_role)`

### 2026-08-08 — corrección: prueba intermitente de resolvePrice en CI

- **Hecho:** el push del paso 5.3 rompió `unit-tests` en CI (no por el
  código de esta tarea — `@tecni/core:test` falló en
  `resolve-price.test.ts`, un archivo que este paso no tocó). La
  prueba "exactamente en el límite de 6h" construye el timestamp con
  `hoursAgo(6)` (`Date.now()` real) y luego `resolvePrice()` vuelve a
  llamar `Date.now()` internamente — el tiempo real transcurrido entre
  ambas llamadas (milisegundos) empuja la edad justo encima de 6h,
  volviendo el resultado `unconfirmed` en vez de `confirmed`: **prueba
  intermitente**, no un bug de `resolvePrice`. Corregido congelando el
  reloj con `vi.useFakeTimers()`/`vi.setSystemTime()` alrededor de los
  dos tests de límite exacto — `hoursAgo()` y el `Date.now()` interno
  ahora leen el mismo instante siempre. Verificado localmente con 5
  corridas seguidas, 19/19 en las cinco.
- **Archivos:** `packages/core/src/catalog/resolve-price.test.ts`.
- **Resultado:** verificación OK. `typecheck`/`lint`/`test` verdes
  (5 corridas locales sin fallos).
- **Commit:** `fix(core): congela el reloj en las pruebas de límite exacto de resolvePrice`

### 2026-08-08 — paso 6.1 (requestQuote)

- **Hecho:** `packages/core/src/commerce/request-quote.ts` —
  `requestQuote(client, items, ctx)` crea `quotes`
  (`status = 'requested'` por defecto del esquema, **sin
  `siigo_quote_id`** — lo pone Siigo, la web nunca genera su propio
  consecutivo, regla 5.3 de `CLAUDE.md`) + `quote_items` en el mismo
  flujo, sin vendedor asignado (queda disponible para que un vendedor
  la tome, Fase 4 del roadmap). Calcula subtotal/IVA (19% fijo,
  mismo criterio que `SiigoMockClient`)/total por línea y del
  encabezado — la única lógica de cálculo de esta fase, no repetida
  en otro lugar.
  **Hallazgo real durante la verificación:** la política
  `quote_items_write_staff` del paso 3.2 solo permite escribir
  `quote_items` a `seller`/`master` — bloqueaba **por completo** que
  un cliente cargara los ítems de su propia solicitud, contradiciendo
  el flujo descrito en `13-MODULE-COMMERCE.md` sección 4 ("el cliente
  solicita cotización... `requestQuote()` crea `quotes` + `quote_items`").
  Corregido con una política nueva, `quote_items_insert_owner`
  (`insert` para la empresa dueña de la cotización), sin tocar
  `quote_items_write_staff` — el cliente puede **agregar** ítems al
  crear, pero sigue sin poder **editar** los que ya insertó (probado
  explícitamente: un `update` posterior del cliente sobre su propio
  `quote_item` es bloqueado por RLS).
- **Verificación:** `pnpm typecheck`/`pnpm lint` verdes en los 8
  paquetes. `get_advisors` re-corrido tras la nueva política: misma
  base ya conocida, nada nuevo. Verificación real vía `execute_sql`
  (proyecto no alcanzable por red desde este entorno): empresa +
  usuario + producto real, `set local role authenticated` con JWT
  simulado — el cliente inserta su `quote_items` (1 fila, confirmado),
  y un intento posterior de `update` sobre esa fila queda bloqueado
  por RLS. Todo en una transacción con limpieza posterior (sin
  residuo, confirmado con `count`).
- **Archivos:**
  `packages/db/migrations/20260808320000_quote_items_insert_owner_policy.sql`,
  `docs/05-RLS-SECURITY-A.md`,
  `packages/core/src/commerce/request-quote.ts`,
  `packages/core/src/index.ts`.
- **Resultado:** verificación OK. **Cierra el paso 6.1.** El
  `Server Action`/UI que dispara `requestQuote()` desde el carrito
  queda para el paso 6.2 (vista de cotizaciones), junto con el botón
  "Solicitar cotización" — este paso se scopeó estrictamente a la
  función de `packages/core` y su corrección de RLS.
- **Commit:** `feat(db): requestQuote + política RLS que permite al cliente cargar sus propios quote_items`

### 2026-08-08 — paso 6.2 (vista de cotizaciones + botón desde el carrito)

- **Hecho:** `requestQuoteFromCartAction()` en
  `apps/web/app/(commerce)/carrito/actions.ts` — toma los ítems del
  carrito que caen en/sobre el umbral (mismo `splitCartByThreshold` +
  lectura de `settings` vía `service_role` que ya usa la página del
  carrito), llama `requestQuote()` (paso 6.1) y **quita esos ítems del
  carrito** (ya no son carrito, son una solicitud real). Botón
  "Solicitar cotización" conectado en `/carrito`, visible solo cuando
  hay ítems en esa sección.
  `apps/web/app/(commerce)/cotizaciones/page.tsx` — lista las
  cotizaciones de la empresa (`quotes_read` de RLS ya filtra), cada una
  con estado (traducido a español, `STATUS_LABEL`), sus `quote_items`
  (descripción, cantidad, total) y el total del encabezado. **Nunca
  muestra un consecutivo propio** — si `siigo_number` es nulo (Siigo
  no la ha procesado, mock por ahora), muestra "Cotización sin número
  aún" en vez de inventar uno (regla 5.3 de `CLAUDE.md`).
- **Verificación:** `pnpm typecheck`/`pnpm lint` verdes en los 8
  paquetes. `pnpm --filter web build` verde (`/cotizaciones`
  registrada). Servidor local: `307` a `/login?next=/cotizaciones` sin
  sesión. Verificación real del flujo completo vía `execute_sql`
  (proyecto no alcanzable por red desde este entorno): empresa +
  usuario + producto real, `set local role authenticated` — carrito
  con un ítem sobre el umbral, simulado el flujo de
  `requestQuoteFromCartAction` (crea `quotes`+`quote_items`, borra el
  `cart_item`): el carrito queda vacío (`0` ítems), la cotización
  tiene exactamente `1` `quote_item`, y el cliente puede leer su
  propia cotización recién creada. Todo en una transacción con
  limpieza posterior (sin residuo, confirmado con `count`).
- **Archivos:**
  `apps/web/app/(commerce)/carrito/{actions.ts,page.tsx}`,
  `apps/web/app/(commerce)/cotizaciones/page.tsx`.
- **Resultado:** verificación OK. **Cierra el paso 6.2.** Falta 6.3
  (`acceptQuote`) para cerrar la Fase 6.
- **Commit:** `feat(web): vista de cotizaciones y botón "Solicitar cotización" desde el carrito`

### 2026-08-08 — paso 6.3 (acceptQuote)

- **Hecho:** `packages/core/src/commerce/accept-quote.ts` —
  `acceptQuote(client, serviceClient, quoteId, ctx)`. Valida que la
  cotización sea de la empresa del que llama y esté `sent` (rechaza
  cualquier otro estado, incluida una ya `accepted` — no se acepta dos
  veces). Copia `quote_items` a `order_items` línea por línea, crea
  `orders` (`status` por defecto `pending_payment` del esquema,
  `quote_id` enlazado, `order_number` generado localmente —
  `ORD-<timestamp36>-<random4>`, esquema simple, sin consecutivo
  fiscal real todavía porque no hay definido uno).
  **Mismo patrón `client`/`serviceClient` que `registerUser`
  (Fase 1):** todas las lecturas/inserts de `orders`/`order_items`
  corren con la sesión real del cliente (`orders_insert` ya lo
  permite); marcar `quotes.status = 'accepted'` corre con
  `serviceClient` — **ninguna política de RLS deja que el cliente
  edite su propia cotización** (`quotes_update_staff` es solo
  vendedor/master, a propósito). En vez de abrir una política nueva
  solo para esta transición (superficie de RLS más difícil de razonar
  que una condición de aplicación), la función ya validó
  `company_id`/`status = 'sent'` en código antes de usar el cliente
  privilegiado — mismo criterio que la lectura de `settings` del paso
  5.3.
  `apps/web/app/(commerce)/cotizaciones/{actions.ts,page.tsx}` —
  `acceptQuoteAction()` conectado a un botón "Aceptar cotización",
  visible solo en cotizaciones con `status = 'sent'`. Sin página de
  pedidos todavía (`/pedidos`, paso 8.1) — la confirmación queda en la
  propia vista de cotizaciones (`?accepted=1`) en vez de enlazar a una
  ruta que no existe.
- **Verificación:** `pnpm typecheck`/`pnpm lint` verdes en los 8
  paquetes. `pnpm --filter web build` verde. Verificación real vía
  `execute_sql` (proyecto no alcanzable por red desde este entorno):
  cotización `sent` real, `set local role authenticated` — el cliente
  crea `orders`+`order_items` con su propia sesión (éxito, confirma
  `orders_insert`), **intenta marcar `quotes.status = 'accepted'` con
  su propia sesión y RLS lo bloquea** (confirma por qué hace falta
  `service_role` — no es una elección arbitraria, es la única forma),
  y el mismo update sí funciona corriendo como `service_role`. `1`
  `order_item` copiado correctamente. Todo en una transacción con
  limpieza posterior (sin residuo, confirmado con `count`).
- **Archivos:** `packages/core/src/commerce/accept-quote.ts`,
  `packages/core/src/index.ts`,
  `apps/web/app/(commerce)/cotizaciones/{actions.ts,page.tsx}`.
- **Resultado:** verificación OK. **Cierra el paso 6.3 y la Fase 6
  completa** (solicitar cotización, verla, aceptarla → pedido). Sigue
  la Fase 7 (checkout y pago).
- **Commit:** `feat(web): acceptQuote — de cotización sent a pedido, con botón "Aceptar cotización"`

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

## Bloqueos

- **Credenciales de Siigo/Wompi:** bloqueante de `progress/TODO.md`, no
  bloquea esta tarea (se usan `SiigoMockClient`/`WompiMockClient`).
- **Inventario real:** sigue bloqueante en `progress/TODO.md`, no bloquea
  esta tarea (datos de prueba, mismo patrón de la Fase 2).
- **R2 sin empezar:** bloquea solo la parte de PDF de factura real (paso
  8.3), no el resto de la fase.

## Pendientes descubiertos

Ninguno todavía.
