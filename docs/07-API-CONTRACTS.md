# 07 — Contratos de API

Volver a [`00-INDEX.md`](./00-INDEX.md) · Arquitectura en
[`01-ARCHITECTURE.md`](./01-ARCHITECTURE.md) · Seguridad en
[`05-RLS-SECURITY-A.md`](./05-RLS-SECURITY-A.md)

---

## 1. Política de versionado

`/api/v1` es **inmutable** una vez publicado (CLAUDE.md regla de oro 7). Un
cambio incompatible (campo eliminado, tipo cambiado, código de estado
distinto) crea `/api/v2`; nunca se rompe un contrato ya publicado. Un campo
nuevo opcional no requiere versión nueva.

Toda la lógica de negocio vive en `packages/core` (CLAUDE.md regla de oro 6)
— las rutas de `apps/web/app/api/v1/*` son delgadas: validan la forma del
request, llaman a una función de `packages/core`, traducen el resultado a un
código de estado HTTP. Nunca contienen lógica de negocio propia.

---

## 2. Autenticación de las rutas

Dos formas, sin mezclar:

- **Sesión de usuario** (cookies de Supabase Auth) — para rutas que un
  cliente/vendedor/técnico llama desde el navegador. RLS aplica normal.
- **Firma verificada, sin sesión** — para webhooks de proveedores externos
  (Wompi, y en el futuro Siigo/Resend). No hay usuario detrás; la ruta usa
  `service_role` (bypassa RLS) solo después de verificar la firma del
  proveedor. Nunca se confía en el body sin verificar la firma primero.

---

## 3. Endpoints

### `POST /api/v1/webhooks/wompi`

Único endpoint real hasta la Fase 3. Documentado en detalle en
[`09-INTEGRATION-PAYMENTS.md`](./09-INTEGRATION-PAYMENTS.md) sección 2 —
acá solo el contrato HTTP.

**Autenticación:** firma del evento (`WompiWebhookEvent.signature.checksum`,
`computeWompiChecksum`), nunca sesión de usuario. `service_role` interno,
nunca expuesto al cliente.

**Request body** (`WompiWebhookEvent`, `packages/integrations/src/wompi/types.ts`):

```json
{
  "event": "transaction.updated",
  "data": { "transaction": { "id": "...", "reference": "ORD-...", "amountInCents": 23800000, "currency": "COP", "status": "APPROVED" } },
  "timestamp": 1735689600000,
  "signature": { "checksum": "...", "properties": ["transaction.id", "transaction.status", "transaction.amount_in_cents"] }
}
```

**Respuestas:**

| Código | Cuándo |
|---|---|
| `200` | Evento procesado o descartado por ser un reintento duplicado (`outcome: "processed"` \| `"duplicate_event"`) — Wompi no debe reintentar en ninguno de los dos casos. |
| `400` | JSON inválido o el body no tiene la forma mínima de un `WompiWebhookEvent`. |
| `401` | La firma no coincide con el checksum recalculado — el evento se descarta **sin tocar la base**. |
| `404` | La firma es válida pero no existe ningún pedido con ese `order_number` como referencia. |

No hay body de error detallado más allá de `{ "error": "..." }` — nunca se
filtra un error de base de datos crudo (CLAUDE.md sección 7).

---

## 4. Pendiente

El resto de operaciones de comercio (agregar al carrito, solicitar
cotización, aceptar cotización, checkout) corren como **Server Actions**
de Next.js, no como rutas de `/api/v1/*` — no necesitan contrato HTTP
público porque solo las llama la propia app desde un formulario del
servidor, con la sesión del usuario. Se documentan en
[`13-MODULE-COMMERCE.md`](./13-MODULE-COMMERCE.md), no acá. Este archivo
crece cuando exista un endpoint pensado para ser llamado desde fuera de la
propia app (integraciones, futuro APK) — no antes.
