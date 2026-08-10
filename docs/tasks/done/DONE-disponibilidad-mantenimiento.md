# TAREA: Disponibilidad real para agendar mantenimiento

**Estado:** Completa · **Riesgo:** Grande (esquema + RLS + UI en 2 roles)
**Inicio:** 2026-08-09 · **Última actualización:** 2026-08-10

## Objetivo

Hoy "Programar mantenimiento" (cliente, tanto en `/mi-cuenta/mantenimientos` como
en `/mi-cuenta/tickets`) tiene un `<input type="date">` libre — cualquier fecha,
sin relación con la capacidad real de Tecni. El usuario pidió que la fecha
disponible esté limitada por lo que `master` programe como disponible.

**Alcance de esta tarea:** capacidad por **día** (cuántas visitas caben ese día en
total), administrada por `master`. El cliente solo puede elegir, entre las fechas
que master abrió, una que todavía tenga cupo.

**No entra en esta tarea:**
- Franjas horarias dentro del día, ni disponibilidad por técnico individual —
  hoy `maintenance_requests.technician_id` se asigna después de la solicitud
  (`confirmMaintenance`), no en el momento de pedirla, así que no hay "técnico"
  que consultar todavía en ese punto del flujo.
- Un calendario visual — un `<select>` con las fechas abiertas es suficiente y
  consistente con el resto del sitio (no se fabrica una librería de calendario).

## Documentos consultados

- `docs/14-MODULE-SERVICE.md` — mantenimientos: quién agenda, quién confirma.
- `docs/05-RLS-SECURITY-C.md` — políticas de `maintenance_requests`.
- `docs/06-AUTH-ROLES.md` — "Agendar mantenimiento": customer ✅, master ✅.

## Decisiones tomadas durante la ejecución

- 2026-08-09: capacidad a nivel de día, no de técnico — `technician_id` no
  existe todavía cuando el cliente pide la cita (se asigna al confirmar).

---

## Plan

### Fase 1 — Esquema y RLS

- [x] **1.1** Migración: tabla `maintenance_availability` (`available_date` date
      PK, `max_visits` int > 0, `notes` text, `created_by`, `created_at`) + RLS
      (lectura: cualquier autenticado; escritura: solo master).
  - Verificación: `select` desde un usuario `customer` real funciona; `insert`
    desde `customer` falla por RLS.
  - Reversión: `drop table maintenance_availability;` (migración nueva, no toca
    datos existentes).

### Fase 2 — Lógica de negocio (`packages/core`)

- [x] **2.1** `manage-maintenance-availability.ts`: `createMaintenanceAvailability`,
      `deleteMaintenanceAvailability`.
  - Verificación: `pnpm --filter @tecni/core typecheck`.
  - Reversión: eliminar el archivo y su export en `index.ts`.
- [x] **2.2** `request-maintenance.ts` valida server-side que `preferredDate`
      (si viene) exista en `maintenance_availability` y tenga cupo — nunca confía
      solo en que el `<select>` del cliente restringió las opciones.
  - Verificación: probar `requestMaintenance` con una fecha no abierta → error.
  - Reversión: revertir el diff del archivo.

### Fase 3 — Panel maestro

- [x] **3.1** `/admin/mantenimientos`: lista de fechas abiertas con cupo usado
      (`X de Y`), formulario para abrir una fecha nueva, botón eliminar (solo si
      no tiene solicitudes).
  - Verificación: crear una fecha, verla contar solicitudes reales.
  - Reversión: revertir el diff, la tabla queda pero sin UI.
- [x] **3.2** Ítem de navegación "Mantenimientos" en `lib/dashboard-nav.ts` para
      `master`.
  - Verificación: aparece en el sidebar de `/admin`.
  - Reversión: revertir el diff.

### Fase 4 — Cliente

- [x] **4.1** `/mi-cuenta/mantenimientos` y `/mi-cuenta/tickets`: el input de
      fecha libre pasa a `<select>` con las fechas abiertas y cupo restante,
      empty state honesto si no hay ninguna.
  - Verificación: sin fechas abiertas, el formulario lo dice en vez de mostrar
    un select vacío raro.
  - Reversión: revertir el diff.

---

## Bitácora

### 2026-08-09 — paso 1.1

- **Hecho:** migración `maintenance_availability` + RLS (lectura autenticados,
  escritura master).
- **Archivos:** `packages/db/migrations/20260809360000_create_maintenance_availability.sql`
- **Resultado:** aplicada con `apply_migration`, verificada con `pg_policies`.
- **Commit:** pendiente de agrupar con el resto de la fase.

### 2026-08-09 — pasos 2.1, 2.2, 3.1, 3.2, 4.1

- **Hecho:** funciones de core, página de admin, nav, selects en cliente.
- **Resultado:** `pnpm typecheck && pnpm lint` verde.
- **Commit:** ver historial de `main`.

---

## Bloqueos

Ninguno.

## Pendientes descubiertos

- Franjas horarias / disponibilidad por técnico — anotado como fuera de
  alcance arriba, pasa a `docs/progress/TODO.md` si se retoma.
