# TAREA: Sección "Calendario" en el panel del técnico

**Estado:** Completa · **Riesgo:** Normal
**Inicio:** 2026-08-17 · **Última actualización:** 2026-08-17

## Objetivo

Vista de calendario mensual en `/tecnico/calendario` para que el
técnico visualice trabajos pendientes y programación de
mantenimientos. Sin tickets (no tienen fecha programada).

Plan completo: `/Users/deiber/.claude/plans/robust-humming-hippo.md`.

## Plan

- [x] **1** Página `/tecnico/calendario/page.tsx` con cuadrícula del mes.
- [x] **2** Ítem "Calendario" en `dashboard-nav.ts`.
- [x] **3** Ícono `calendar` nuevo en `packages/ui`.

## Bitácora

### 2026-08-17 — Inicio
- Plan aprobado. Empezando Fase 1.

### 2026-08-17 — Cierre
- Las 3 fases implementadas: página nueva con cuadrícula de mes
  (misma matemática que `maintenance-availability-calendar.tsx`, sin
  reutilizar el componente porque su modelo de datos es de cupo, no de
  trabajos asignados), ítem de navegación, ícono `calendar` nuevo.
- Corrección real de zona horaria: los `dateKey` se construyen con
  `toLocaleDateString("en-CA", { timeZone: "America/Bogota" })`, no
  `.toISOString().slice(0,10)` — un `scheduled_at` cerca de medianoche
  hora Colombia podría caer en el día equivocado con UTC crudo.
- `pnpm typecheck && pnpm lint` limpios, build de producción exitoso.
- Verificado en Chrome real con `tecnico@tecni.demo`: "Calendario" en
  el sidebar, mes actual con día de hoy resaltado, navegación
  anterior/hoy/siguiente por `?month=`. Se insertaron 3
  `maintenance_requests` de prueba vía SQL (una pendiente, una
  completada, y una tercera con `scheduled_at` deliberadamente cerca
  de medianoche Bogotá cruzando el límite UTC — `2026-08-07 02:00
  UTC` = `2026-08-06 21:00` Bogotá) — **confirmado que cayó en el día
  6, no el 7**, validando la corrección de zona horaria. Datos de
  prueba eliminados después de verificar.
- Sin tickets de soporte en este calendario (confirmado que no tienen
  columna de fecha programada).
- Sin migración ni cambio de RLS.

## Bloqueos

Ninguno.
