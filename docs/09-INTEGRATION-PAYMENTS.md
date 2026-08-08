# 09 — Integración de pagos (Wompi)

Volver a [`00-INDEX.md`](./00-INDEX.md) · Módulo en
[`13-MODULE-COMMERCE.md`](./13-MODULE-COMMERCE.md) · Variables de entorno en
[`19-DEPLOYMENT.md`](./19-DEPLOYMENT.md) sección 4

---

## 1. Estado

`PENDIENTE-DECISIÓN` (contrato con Wompi, ver `progress/TODO.md`). Mientras
no existan credenciales reales, esta fase se construye contra
`WompiMockClient` (sección 5) — mismo contrato que tendrá el cliente real, sin
red, determinístico. Se reemplaza sin tocar el código que lo consume, igual
que ya está probado con `SiigoMockClient` en el catálogo.

Variables de entorno (`packages/shared/src/env.ts`, todas `.optional()`
hasta que exista el contrato):

| Variable | Uso |
|---|---|
| `WOMPI_PUBLIC_KEY` | Cliente — llega al navegador a propósito (checkout widget) |
| `WOMPI_PRIVATE_KEY` | Servidor — crea transacciones, nunca al cliente |
| `WOMPI_EVENTS_SECRET` | Servidor — firma del webhook de eventos |
| `WOMPI_INTEGRITY_SECRET` | Servidor — firma de integridad al iniciar el checkout |

---

## 2. Flujo

1. El cliente hace checkout de los ítems bajo el umbral
   (`13-MODULE-COMMERCE.md` sección 5) — se crea `orders`
   (`status = 'pending_payment'`) en la base **antes** de mandar al
   cliente a pagar. El pedido existe aunque el pago falle o se abandone.
2. El servidor genera la firma de integridad
   (`sha256(referencia + monto + moneda + WOMPI_INTEGRITY_SECRET)`, formato
   real de Wompi) y arma el checkout (widget o redirect, a decidir cuando
   haya credenciales).
3. Wompi procesa el pago y **llama al webhook** — la web nunca confía en el
   redirect de vuelta del cliente para marcar un pedido como pagado. El
   redirect solo muestra "estamos confirmando tu pago", el webhook es la
   única fuente de verdad.
4. El webhook (`/api/v1/webhooks/wompi`, `POST`, `service_role`):
   - Verifica la firma del evento contra `WOMPI_EVENTS_SECRET` (formato
     real de Wompi: `sha256` de los campos del evento en el orden que
     Wompi documenta + el secreto). **Un evento sin firma válida se
     descarta sin tocar la base** — no hay excepción, ni siquiera en
     desarrollo (`WompiMockClient` simula un evento ya firmado
     correctamente, para probar el camino feliz sin desactivar la
     verificación).
   - Inserta una fila en `payments` (nunca sobrescribe una existente —
     `unique (provider, provider_ref)` del esquema evita duplicados si
     Wompi reintenta el mismo evento).
   - Si el evento es `APPROVED`, actualiza `orders.status = 'paid'`.
   - Si es `DECLINED`/`VOIDED`, el pedido queda en `pending_payment` (el
     cliente puede reintentar) — no se cancela automáticamente.
5. El cliente ve la confirmación en su dashboard cuando el webhook ya
   corrió — puede tardar segundos, la UI lo comunica ("confirmando tu
   pago...", no "pago exitoso" antes de tiempo).

---

## 3. Conciliación

`payments` es el historial completo de intentos, nunca se borra ni se
sobrescribe una fila. Para conciliar: sumar `payments.amount_cop` con
`status = 'approved'` por pedido y compararlo contra `orders.total_cop`. Un
pedido con múltiples intentos fallidos antes de uno aprobado es normal, no
un error — el historial completo queda.

---

## 4. Reembolsos

Fuera de esta fase — Wompi soporta reembolsos vía API, pero no hay flujo de
negocio definido todavía (¿quién los autoriza? ¿parcial o total?). Se agrega
como `PENDIENTE-DECISIÓN` en `progress/TODO.md` cuando el negocio lo defina,
no se improvisa acá.

---

## 5. `WompiMockClient` (desarrollo sin credenciales)

`packages/integrations/src/wompi/` — mismo patrón que `SiigoMockClient`
(`08-INTEGRATION-SIIGO.md` sección 6):

- `createTransaction(orderId, amountCop)` → referencia determinística
  (hash del `orderId`), sin llamada de red, `status: 'PENDING'`.
- `simulateApprovedEvent(reference)` → construye el payload del webhook con
  la firma correcta calculada con un `WOMPI_EVENTS_SECRET` de prueba —
  permite probar la ruta del webhook de punta a punta (firma incluida) sin
  desactivar la verificación en ningún punto del código real.

Se reemplaza por el cliente real cuando existan credenciales — mismo
contrato, sin tocar el webhook ni el checkout que lo consumen.
