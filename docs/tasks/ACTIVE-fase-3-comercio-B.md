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

## Bloqueos

- **Credenciales de Siigo/Wompi:** bloqueante de `progress/TODO.md`, no
  bloquea esta tarea (se usan `SiigoMockClient`/`WompiMockClient`).
- **Inventario real:** sigue bloqueante en `progress/TODO.md`, no bloquea
  esta tarea (datos de prueba, mismo patrón de la Fase 2).
- **R2 sin empezar:** bloquea solo la parte de PDF de factura real (paso
  8.3), no el resto de la fase.

## Pendientes descubiertos

Ninguno todavía.
