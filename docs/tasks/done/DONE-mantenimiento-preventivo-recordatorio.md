# TAREA: Intervalo de mantenimiento preventivo editable + recordatorio por correo

**Estado:** Completada · **Riesgo:** Grande
**Inicio:** 2026-08-16 · **Última actualización:** 2026-08-16

## Objetivo

Master puede editar cada cuántos meses un equipo (`owned_equipment`)
requiere mantenimiento preventivo; el sistema envía un correo a la
empresa dueña del equipo 15 días antes del vencimiento. Primera
integración real de Resend y primer cron job del proyecto.

Plan completo: `/Users/deiber/.claude/plans/robust-humming-hippo.md`.

**Decisiones confirmadas:** intervalo en meses; solo master edita
(RLS existente, sin política nueva); Resend aún no configurado en
Vercel — se construye completo mostrando el hueco de configuración al
cerrar.

## Plan

### Fase 1 — Esquema
- [x] **1.1** Migración: 4 columnas nuevas en `owned_equipment`.
- [x] **1.2** Actualizar doc de esquema.

### Fase 2 — `packages/core`
- [x] **2.1** `setMaintenanceInterval`.
- [x] **2.2** Hook en `completeMaintenance`.
- [x] **2.3** Tests.

### Fase 3 — Integración Resend
- [x] **3.1** `packages/integrations/src/resend/client.ts`.
- [x] **3.2** `docs/10-INTEGRATION-RESEND.md` + índice.

### Fase 4 — Cron
- [x] **4.1** `apps/web/vercel.json` (se usó JSON, no `.ts` — sin
      dependencia nueva para un solo campo estático `crons`, ver
      bitácora).
- [x] **4.2** `apps/web/app/api/cron/maintenance-reminders/route.ts`.
- [x] **4.3** Documentar en `19-DEPLOYMENT.md`/`24-OPERATIONS.md`.

### Fase 5 — UI admin + cliente
- [x] **5.1** `/admin/equipos` con edición inline del intervalo.
- [x] **5.2** "Mis equipos" del cliente muestra próximo vencimiento.

### Fase 6 — Docs y cierre
- [x] **6.1** `docs/14-MODULE-SERVICE.md`.
- [x] **6.2** Changelog, mover a done/, avisar variables Vercel faltantes.

## Bitácora

### 2026-08-16 — Inicio
- Plan aprobado. Empezando Fase 1.

### 2026-08-16 — Fases 1 a 6 completas
- **Hecho:** migración `20260817100000_owned_equipment_maintenance_interval.sql`
  aplicada (4 columnas + índice parcial). `setMaintenanceInterval` (core)
  y hook en `completeMaintenance` que reinicia el ciclo al completar un
  mantenimiento real. Primera integración real de Resend
  (`packages/integrations/src/resend/client.ts`, REST directa sin SDK,
  mismo criterio liviano que R2) y primer cron del proyecto
  (`apps/web/vercel.json` + `/api/cron/maintenance-reminders`, protegido
  con `CRON_SECRET`). Nueva sección `/admin/equipos` (única gestión de
  `owned_equipment` que existía en admin hasta ahora) y "Próximo
  mantenimiento preventivo" visible en `/mi-cuenta/equipos/[id]`. Creado
  `docs/10-INTEGRATION-RESEND.md` (faltaba en el índice) y actualizado
  `docs/14-MODULE-SERVICE.md` sección 4.5.
- **Desviación del plan:** se usó `apps/web/vercel.json` en vez de
  `vercel.ts` — el campo `crons` es completamente estático acá, y
  `vercel.ts` habría exigido agregar la dependencia `@vercel/config`
  solo para eso; `vercel.json` cubre el caso sin dependencia nueva.
- **Verificación:** `pnpm typecheck`/`lint` en verde, 150 tests de
  `packages/core` en verde (10 nuevos: `setMaintenanceInterval` +
  recálculo en `completeMaintenance`). Migración con `get_advisors` sin
  hallazgos nuevos. Prueba extremo a extremo por SQL directa sobre un
  equipo real: fijar vencimiento a 15 días → la consulta del cron lo
  selecciona; marcar `maintenance_reminder_sent_for` = esa fecha → deja
  de seleccionarlo (idempotencia confirmada); dato de prueba revertido.
  Build de producción real: rutas `/admin/equipos` y
  `/api/cron/maintenance-reminders` presentes; el cron responde 401 sin
  header o con header incorrecto (falla cerrado, tal como debe ser sin
  `CRON_SECRET` configurada); `/admin/equipos` redirige a `/login` sin
  sesión. **No se probó un envío de correo real** — Resend no está
  configurado en Vercel todavía (confirmado con el usuario antes de
  empezar).
- **Pendiente del lado del usuario (no soy yo quien lo hace — vive en
  Vercel):** crear `RESEND_API_KEY`, `RESEND_FROM_EMAIL` y
  `CRON_SECRET` en Vercel → Environment Variables, y verificar el
  dominio de envío en Resend. Sin esas tres variables, el intervalo se
  puede editar y `next_maintenance_due_at` se calcula igual — solo el
  correo queda pendiente (`docs/10-INTEGRATION-RESEND.md` sección 5).
- **Archivos:** ver plan `/Users/deiber/.claude/plans/robust-humming-hippo.md`.
- **Commit:** pendiente (se hace a continuación).

## Bloqueos

Ninguno — cierre de tarea, pendiente de configuración externa en
Vercel (no bloquea el código, ver bitácora).
