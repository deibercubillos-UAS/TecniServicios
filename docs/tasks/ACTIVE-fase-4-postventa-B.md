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

## Bloqueos

- **R2 sin empezar:** bloquea servir manuales/adjuntos/firma real
  (`docs/11-STORAGE-R2.md`). No bloquea el resto de la fase — se muestra
  "pendiente de sincronización", mismo criterio que la factura en Fase 3.
- **Resend sin dominio verificado:** bloquea notificaciones por correo en
  cambios de estado (`progress/TODO.md`). Fuera de alcance de esta fase.

## Pendientes descubiertos

Ninguno todavía.
