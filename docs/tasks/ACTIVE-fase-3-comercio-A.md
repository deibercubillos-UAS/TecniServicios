# TAREA: Fase 3 — Comercio (parte A: plan)

Parte B (bitácora, bloqueos, pendientes): [`ACTIVE-fase-3-comercio-B.md`](./ACTIVE-fase-3-comercio-B.md)

**Estado:** En curso · **Riesgo:** Riesgoso (RLS, precios, pagos, empresa)
**Inicio:** 2026-08-08

---

## 0. Objetivo

Que una compra real de punta a punta funcione: carrito → (pago directo o
cotización según el umbral) → pedido → factura visible, con Siigo y Wompi
todavía sin credenciales reales (`PENDIENTE-DECISIÓN`, `progress/TODO.md`).

**Desviación deliberada, documentada desde ya:** sin credenciales de Wompi ni
Siigo, esta fase se construye contra `SiigoMockClient` (ya existe, Fase 2) y un
`WompiMockClient` nuevo (mismo patrón: mismo contrato que tendrá el cliente
real, sin red, determinístico). El día que existan credenciales reales, se
reemplaza el cliente sin tocar el código que lo consume — igual que ya está
probado con Siigo en el catálogo.

**Alcance de carrito en v1:** solo carritos de usuarios **autenticados**
(`profile_id`/`company_id`). La columna `session_id` para carrito anónimo
(`04-DATABASE-SCHEMA-B.md`) queda sin usar por ahora — añade una superficie de
RLS/fusión-al-login que no es necesaria para "que una compra funcione de punta
a punta" y se puede sumar después sin romper nada. Anotado como pendiente
descubierto.

---

## Fase 1 — Documentación

- [x] **1.1** `docs/13-MODULE-COMMERCE.md`: carrito (v1 solo autenticado),
  división por umbral (`settings.quote_threshold_cop`), flujo de cotización
  (solicitud → asignación de vendedor → Siigo cotiza → cliente ve),
  aceptación de cotización → pedido, checkout con Wompi, estados de pedido,
  guía de envío manual, factura visible, dashboard del cliente.
- [x] **1.2** `docs/09-INTEGRATION-PAYMENTS.md`: contrato de Wompi
  (crear transacción, webhook, verificación de firma con
  `WOMPI_EVENTS_SECRET`), conciliación, `WompiMockClient` para desarrollar
  sin credenciales.
- [x] **1.3** Sección "Comercio" en `05-RLS-SECURITY-A.md`: política exacta de
  `carts`/`cart_items`/`quotes`/`quote_items`/`orders`/`order_items`/
  `payments`/`shipments` — todas por `company_id` (mismo patrón de
  aislamiento probado en Fase 1), vendedor solo ve lo asignado, escritura de
  `payments` solo desde el webhook (`service_role`).

## Fase 2 — Esquema

- [x] **2.1** Migración: enums `quote_status`/`order_status`/`payment_status`
  (verificar primero si ya existen — `04-DATABASE-SCHEMA-A.md` los define
  pero puede que no se hayan aplicado).
- [x] **2.2** Migración `carts` + `cart_items`, RLS habilitada sin políticas.
- [x] **2.3** Migración `quotes` + `quote_items`, RLS habilitada sin políticas.
- [x] **2.4** Migración `orders` + `order_items`, RLS habilitada sin políticas.
- [x] **2.5** Migración `payments`, RLS habilitada sin políticas.
- [x] **2.6** Migración `shipments`, RLS habilitada sin políticas.
- [x] **2.7** `get_advisors` (seguridad) — cero advertencias sin justificar.

## Fase 3 — RLS (prueba real: anónimo, otra empresa, rol inferior)

- [x] **3.1** `carts`/`cart_items`: solo el dueño de la empresa lee/escribe
  las suyas. Prueba con dos empresas reales: A no ve el carrito de B.
- [x] **3.2** `quotes`/`quote_items`: la empresa dueña lee las suyas, el
  vendedor asignado lee las suyas, `master` lee todas. Escritura de
  `status`/`siigo_*` solo `master`/vendedor asignado — el cliente no cambia
  el estado de su propia cotización.
- [x] **3.3** `orders`/`order_items`: mismo patrón que `quotes`.
- [x] **3.4** `payments`: lectura por la empresa dueña del pedido y
  `master`; **sin política de insert/update para `authenticated`** — solo
  `service_role` desde el webhook escribe.
- [ ] **3.5** `shipments`: lectura por la empresa dueña; escritura solo
  vendedor/master (carga manual de guía).
- [ ] **3.6** `get_advisors` de cierre.

## Fase 4 — Base para el checkout

- [ ] **4.1** Confirmar/crear el registro semilla de
  `settings.quote_threshold_cop` (`5000000`) — `04-DATABASE-SCHEMA-B.md`
  sección 7 ya lo documenta como obligatorio, verificar si quedó aplicado en
  Fase 0/1.
- [ ] **4.2** `WompiMockClient` en `packages/integrations` — mismo contrato
  documentado en 1.2, sin red, determinístico por referencia.

## Fase 5 — Carrito

- [ ] **5.1** `splitCartByThreshold(items, thresholdCop)` en `packages/core`
  — separa ítems de compra directa de los que van a cotización. Función
  pura, con pruebas unit reales de los límites exactos del umbral.
- [ ] **5.2** Server Actions: agregar/quitar/actualizar cantidad. El precio
  se congela en `cart_items.unit_price_cop` al agregar, vía `resolvePrice()`
  — nunca se vuelve a leer `products.price_cop` después.
- [ ] **5.3** UI del carrito: lista de ítems, división visible bajo/sobre el
  umbral antes de pagar (regla de negocio 5.2 de `CLAUDE.md`).

## Fase 6 — Cotización

- [ ] **6.1** `requestQuote(cartItems, ctx)` en `packages/core` — crea
  `quotes` (`status = 'requested'`, sin `siigo_quote_id` todavía — lo pone
  Siigo) + `quote_items`. Sin vendedor asignado en la creación (se asigna
  después, panel de vendedor es Fase 4 del roadmap — acá solo queda
  disponible para asignar).
- [ ] **6.2** Vista de cotizaciones del cliente (dashboard): estado, ítems,
  total — nunca genera su propio consecutivo, solo muestra el que venga de
  Siigo (mock por ahora).
- [ ] **6.3** `acceptQuote(quoteId, ctx)` — de una cotización `sent`, crea
  `orders` + `order_items`, `status = 'pending_payment'`.

## Fase 7 — Checkout y pago

- [ ] **7.1** Checkout de los ítems bajo el umbral: crea `orders` +
  `order_items` directo (sin pasar por `quotes`), `status =
  'pending_payment'`.
- [ ] **7.2** Iniciar transacción con `WompiMockClient`.
- [ ] **7.3** Webhook `/api/v1/webhooks/wompi` — verifica firma
  (`WOMPI_EVENTS_SECRET`, mock por ahora), inserta/actualiza `payments`,
  actualiza `orders.status` a `paid`. **Riesgoso: solo `service_role`,
  nunca confía en el body sin verificar firma.**
- [ ] **7.4** Confirmación visible al cliente tras el pago.

## Fase 8 — Pedidos, envío, factura

- [ ] **8.1** Estados de pedido + vista de detalle en el dashboard.
- [ ] **8.2** Carga manual de guía de envío (`shipments`) — acción del
  vendedor.
- [ ] **8.3** Factura visible — `siigo_invoice_id`/`invoice_pdf_r2_key`; sin
  R2 real todavía (`docs/11-STORAGE-R2.md`, sin empezar), así que el PDF
  queda como "pendiente de sincronización" hasta esa integración, sin
  fabricar un enlace que no existe.

## Fase 9 — Dashboard del cliente

- [ ] **9.1** `/mi-cuenta`: resumen de pedidos, cotizaciones, facturas y
  datos de la empresa — primera pantalla protegida por rol de todo el
  proyecto (middleware ya la protege desde Fase 1, sin contenido real
  todavía).

## Fase 10 — Cierre

- [ ] **10.1** Checklist de seguridad de `05-RLS-SECURITY-B.md` sección 9 +
  las tres preguntas de `CLAUDE.md` — acá sí aplican de verdad "qué ve otra
  empresa" y "qué ve un rol inferior" (vendedor vs. cliente vs. master).
- [ ] **10.2** Actualizar `21-ROADMAP.md`/`progress/TODO.md`/
  `progress/CHANGELOG.md`, mover la tarea a `tasks/done/`.

---

## Fuera de alcance de esta fase (anotado, no se construye acá)

- Carrito verdaderamente anónimo (`cart_items.session_id`, fusión al login).
- Panel de vendedor completo (agenda de visitas, clientes asignados) — Fase 4
  del roadmap.
- Sincronización real con Siigo/Wompi — bloqueada por credenciales
  (`PENDIENTE-DECISIÓN`).
- Manuales/PDF de factura servidos desde R2 — Fase 4/`11-STORAGE-R2.md`.
