# 13 — Módulo Comercio

Volver a [`00-INDEX.md`](./00-INDEX.md) · Esquema en [`04-DATABASE-SCHEMA-B.md`](./04-DATABASE-SCHEMA-B.md)
sección 5 · RLS en [`05-RLS-SECURITY-C.md`](./05-RLS-SECURITY-C.md) · Pagos en
[`09-INTEGRATION-PAYMENTS.md`](./09-INTEGRATION-PAYMENTS.md) · Precios en
[`08-INTEGRATION-SIIGO.md`](./08-INTEGRATION-SIIGO.md)

---

## 1. Alcance

Carrito, división de la compra por el umbral de cotización, solicitud y
aceptación de cotización, pedido, pago con Wompi, envío y factura visible.
**No entra acá:** catálogo (`12-MODULE-CATALOG.md`), postventa —
`owned_equipment`, manuales, mantenimiento — (`14-MODULE-SERVICE.md`), panel
de vendedor completo (agenda de visitas, clientes asignados — Fase 4 del
roadmap).

**v1 de esta fase:** el carrito es siempre de un usuario autenticado con
empresa. El carrito verdaderamente anónimo (`cart_items.session_id` del
esquema) queda sin construir — se agrega después sin romper nada, no bloquea
que la compra funcione de punta a punta.

---

## 2. Regla de oro: el umbral de $5.000.000 COP

Repetida de `CLAUDE.md` sección 5.2 porque toda esta fase gira alrededor de
ella:

- Producto **< umbral** → compra directa: carrito → Wompi → pedido.
- Producto **≥ umbral** → sin botón de compra, solo "Solicitar cotización".
- El umbral es `settings.quote_threshold_cop` (parámetro editable desde el
  panel maestro, nunca hardcodeado en el código).
- Un carrito mixto se **divide**: los ítems bajo el umbral se pagan, los que
  están sobre el umbral pasan a cotización. El usuario ve la división
  explícita antes de pagar — nunca se paga sin saber que una parte del
  pedido quedó fuera.

`splitCartByThreshold(items, thresholdCop)` en `packages/core` es la única
función que decide esto — la UI nunca compara precios contra el umbral por su
cuenta.

---

## 3. Carrito

- Un carrito por `(profile_id, company_id)` — todos los usuarios de la misma
  empresa comparten el mismo carrito (regla de negocio 5.4 de `CLAUDE.md`:
  "una empresa, varios usuarios").
- `cart_items.unit_price_cop` se **congela** al agregar el ítem, vía
  `resolvePrice()` — nunca se vuelve a leer `products.price_cop` después. Si
  el precio de Siigo cambió entre que se agregó y que se paga, el carrito
  muestra el precio congelado (con una nota de "puede haber cambiado,
  confirma antes de pagar" — decisión de UX, no de datos).
- Agregar un producto ≥ umbral al carrito es válido — la división ocurre al
  pagar/cotizar, no al agregar. Esto evita que el carrito tenga dos
  comportamientos distintos según el producto.

---

## 4. Cotización

1. El cliente solicita cotización de los ítems ≥ umbral (o de todo el
   carrito, si el usuario elige "cotizar todo" en vez de dividir).
2. `requestQuote()` crea `quotes` (`status = 'requested'`) + `quote_items`,
   **sin vendedor asignado todavía** — la asignación real (panel de
   vendedor, notificación) es Fase 4 del roadmap; por ahora la cotización
   queda disponible para que un vendedor la tome manualmente desde Supabase
   o el futuro panel.
3. **Siigo cotiza, la web no genera consecutivos** (regla 5.3 de
   `CLAUDE.md`) — `quotes.siigo_quote_id`/`siigo_number` se llenan cuando
   Siigo la procese (mock por ahora, ver `08-INTEGRATION-SIIGO.md`).
   `status` pasa a `sent` cuando eso pase.
4. El cliente ve el estado en su dashboard — nunca edita `status` ni los
   totales, eso lo escribe el vendedor/master.
5. `acceptQuote(quoteId)`: de una cotización `sent`, crea `orders` +
   `order_items` copiando los ítems de la cotización, `status =
   'pending_payment'`. Cotización `accepted_at` se marca en el mismo paso.

---

## 5. Checkout y pago (Wompi)

Ítems bajo el umbral, en lugar de pasar por cotización:

1. Checkout crea `orders` + `order_items` directo, `status =
   'pending_payment'`.
2. Se inicia una transacción con Wompi (mock hasta que existan credenciales
   reales — contrato completo en `09-INTEGRATION-PAYMENTS.md`).
3. El webhook de Wompi (`/api/v1/webhooks/wompi`) es la **única** fuente de
   verdad de que un pago se completó — nunca se marca `orders.status =
   'paid'` desde el cliente ni al redirigir de vuelta del checkout, solo
   cuando el webhook confirma la firma y el estado. Ver
   `09-INTEGRATION-PAYMENTS.md` sección de verificación de firma.
4. `payments` registra cada intento (`pending`/`approved`/`declined`/
   `voided`/`refunded`) — es el historial de conciliación, no se sobrescribe.

---

## 6. Pedido, envío, factura

- Estados de `orders`: `pending_payment` → `paid` → `preparing` → `shipped`
  → `delivered` (o `cancelled` en cualquier punto antes de `shipped`).
- La guía de envío se carga **manualmente** por el vendedor
  (`shipments.tracking_number`/`tracking_url`) — no hay integración con
  transportadora en esta fase.
- La factura (`orders.siigo_invoice_id`/`invoice_pdf_r2_key`) la genera
  Siigo, no la web. Sin R2 conectado todavía
  (`11-STORAGE-R2.md`, sin empezar), el PDF se muestra como "pendiente de
  sincronización" en vez de un enlace fabricado que no existe.

---

## 7. Dashboard del cliente (`/mi-cuenta`)

Resumen de pedidos, cotizaciones, facturas y datos de la empresa — la
primera pantalla protegida por rol de todo el proyecto con contenido real
(el middleware ya la protege desde la Fase 1). Un usuario solo ve los datos
de **su** empresa (`company_id`), nunca de otra — es la aplicación directa
de la regla de negocio 5.4 y el mismo patrón de aislamiento probado con RLS
real en la Fase 1.

---

## 8. Roles dentro de esta fase

| Rol | Ve |
|---|---|
| `customer` | Su carrito, sus cotizaciones, sus pedidos, su empresa |
| `seller` | Las cotizaciones/pedidos de sus clientes asignados |
| `master` | Todo |

Matriz completa en `06-AUTH-ROLES.md`. El panel de vendedor (agenda de
visitas, lista de clientes) es Fase 4 del roadmap — acá el vendedor solo
necesita ver y actuar sobre lo que ya tiene asignado.
