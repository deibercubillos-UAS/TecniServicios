# TAREA: Llevar el estilo visual del panel master a vendedor/técnico/cliente

**Estado:** Completa · **Riesgo:** Grande (superficie, no complejidad)
**Inicio:** 2026-08-16 · **Última actualización:** 2026-08-16

## Objetivo

Parejar el estilo visual de `/admin` (StatCard, listas con card +
filtros + paginación, `StatusBadge` con ícono) en `/ventas`,
`/tecnico` y repasar `/mi-cuenta`. Solo estilo — sin replicar acciones
ni ampliar alcance de datos (RLS sin cambios).

Plan completo: `/Users/deiber/.claude/plans/robust-humming-hippo.md`.

## Plan

- [x] **1** `StatCard` compartido (`apps/web/components/stat-card.tsx`).
- [x] **2** Dashboards `/ventas` y `/tecnico` con `StatCard` + saludo compartido.
- [x] **3** Lista de pedidos (vendedor): card + filtro + paginación + `StatusBadge`.
- [x] **4** Lista de tickets (técnico): card + filtro + paginación + `StatusBadge`. Se agregó `TICKET_STATUS_LABEL_STAFF` en `@/lib/ticket-status` (misma redacción para `waiting_customer` que en staff, distinta de la vista cliente).
- [x] **5** Mantenimientos (técnico): `StatusBadge` con `@/lib/maintenance-status`.
- [x] **6** Repaso de cliente (`mi-cuenta`) — confirmado sin cambios: `mi-cuenta/tickets` y `mi-cuenta/mantenimientos` ya usan `StatusBadge` + cards con hover, no necesitan paginación (volumen por empresa).

## Bitácora

### 2026-08-16 — Inicio
- Plan aprobado. Empezando Fase 1.

### 2026-08-16 — Cierre
- Las 6 fases implementadas: `StatCard`/`greeting()` compartidos
  (elimina duplicación en `admin/page.tsx` y `mi-cuenta/page.tsx`);
  dashboards de `/ventas` y `/tecnico` con el mismo patrón de tarjetas;
  listas de pedidos (vendedor) y tickets (técnico) con card + filtro
  `<select>` + paginación real (`PAGE_SIZE=50`), mismo patrón que
  `admin/auditoria`; badges de estado con ícono (`StatusBadge`) en
  pedidos, tickets y mantenimientos, reemplazando el `<span>` de texto
  plano y los objetos de label duplicados a mano en cada archivo.
- `pnpm typecheck && pnpm lint` limpios en las 6 fases, build de
  producción exitoso.
- Verificación visual en Chrome real con las 4 cuentas demo
  (`master@tecni.demo`, `vendedor@tecni.demo`, `tecnico@tecni.demo`,
  `cliente@tecni.demo`): dashboard, lista con filtro aplicado y un
  detalle por rol — el estilo coincide con `/admin` en los 4 roles, y
  cada uno sigue viendo solo lo que ya veía (RLS sin cambios).
- Detalle no previsto en el plan original: el label compartido de
  `@/lib/ticket-status` para `waiting_customer` ("Esperando tu
  respuesta") está escrito desde la perspectiva del cliente — usarlo
  tal cual en las vistas de staff confundiría (da a entender que el
  staff espera su propia respuesta). Se agregó
  `TICKET_STATUS_LABEL_STAFF` en el mismo archivo, mismo objeto con
  esa única clave reescrita ("Esperando al cliente"), usado por
  `tecnico/tickets/page.tsx` y `tecnico/tickets/[id]/page.tsx`.
- `mi-cuenta/tickets` y `mi-cuenta/mantenimientos` no requirieron
  cambios — ya usaban `StatusBadge` y cards con hover desde antes.

## Bloqueos

Ninguno.
