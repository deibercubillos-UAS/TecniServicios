# TAREA: Fotos + firma del cliente al completar mantenimiento

**Estado:** Completa · **Riesgo:** Grande
**Inicio:** 2026-08-17 · **Última actualización:** 2026-08-17

## Objetivo

Técnico sube fotos y captura firma de conformidad al completar un
mantenimiento (esquema ya lo soportaba, sin usar). Cliente ve el
historial de mantenimientos (fotos + firma incluidas) en su equipo.

Plan completo: `/Users/deiber/.claude/plans/robust-humming-hippo.md`.

## Plan

- [x] **1** `buildMaintenanceAssetKey` + `completeMaintenance` extendido.
- [x] **2** `completeMaintenanceAction` sube fotos/firma a R2.
- [x] **3** UI técnico: input de fotos + `SignaturePad` (canvas).
- [x] **4** Historial visible en `/mi-cuenta/equipos/[id]` y `/mi-cuenta/mantenimientos`.
- [x] **5** Actualizar `docs/14-MODULE-SERVICE.md`.

## Bitácora

### 2026-08-17 — Inicio
- Plan aprobado. Empezando Fase 1.

### 2026-08-17 — Cierre
- Las 5 fases implementadas: `buildMaintenanceAssetKey` (R2),
  `completeMaintenance` extendido con `attachments`/
  `customerSignatureUrl` (esquema ya los tenía, sin migración),
  `completeMaintenanceAction` sube fotos y firma antes de llamar a
  `completeMaintenance` (mismo patrón que `uploadProductImagesAction`),
  `SignaturePad` (canvas nuevo, sin librería externa), historial
  visible en `/mi-cuenta/equipos/[id]` y `/mi-cuenta/mantenimientos`
  vía helper compartido `get-maintenance-history.ts` +
  `MaintenanceHistoryList`.
- Firma obligatoria para completar (conformidad real del cliente);
  fotos opcionales. Nombre de quien firma se antepone a
  `recommendations` como "Recibido por: {nombre}" (sin columna
  dedicada en el esquema, evita migración nueva).
- `pnpm typecheck && pnpm lint` limpios, build de producción exitoso.
- Verificación en Chrome real con `tecnico@tecni.demo`: el formulario
  de completar (fotos, nombre, canvas de firma) funciona correctamente
  — el trazo se capturó y mostró "Firma capturada". La subida real a
  R2 **no se pudo probar end-to-end en local** porque las credenciales
  R2 están enmascaradas (`[SENSITIVE]`) en `.env.local` por diseño del
  entorno (limitación ya documentada en sesiones previas) — confirmado
  que el código falla limpiamente en el límite externo esperado (R2)
  sin crear ningún registro corrupto en la base (`maintenance_reports`
  quedó en 0 filas para esa solicitud tras el error).
- Para verificar la parte visual del historial (que no depende de R2
  real, solo de URLs ya guardadas), se insertó un reporte de prueba
  vía SQL con una foto y firma reales de R2 — confirmado con
  `cliente@tecni.demo` en ambas páginas: fotos, firma, y "Recibido
  por: Juan Pérez" se ven correctamente. Datos de prueba eliminados
  después de verificar.
- **Pendiente real para el usuario:** la subida a R2 solo se puede
  confirmar end-to-end en producción/Vercel (donde las variables R2
  reales sí están disponibles) — recomendado probar el flujo completo
  ahí tras el deploy.
- Sin migración ni cambio de RLS.

## Bloqueos

Ninguno.
