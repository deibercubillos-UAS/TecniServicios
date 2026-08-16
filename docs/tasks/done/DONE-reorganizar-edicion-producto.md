# TAREA: Reorganizar la edición de producto en el panel maestro

**Estado:** Completada · **Riesgo:** Normal
**Inicio:** 2026-08-16 · **Última actualización:** 2026-08-16

## Objetivo

Reorganizar `/admin/productos/[id]/page.tsx` (890 líneas, 7 secciones
siempre expandidas) para mejorar el IX: secciones colapsables
(`<details>/<summary>`, sin JS, mismo patrón que
`admin/auditoria/page.tsx`) con resumen de estado, menú de anclas
arriba, y el bloque de 4 checkboxes de "Datos básicos" separado en 3
sub-grupos claros. Solo layout — sin cambios de lógica/datos.

Plan completo: `/Users/deiber/.claude/plans/robust-humming-hippo.md`.

## Plan

- [x] **1.1** Menú de anclas bajo el encabezado.
- [x] **1.2** Separar checkboxes de "Datos básicos" en 3 sub-grupos.
- [x] **1.3** Convertir secciones en `<details>` con resumen de estado.
- [x] **1.4** `open` condicionado por searchParams de éxito/error.

## Bitácora

### 2026-08-16 — Inicio
- Plan aprobado. Empezando implementación.

### 2026-08-16 — Implementación completa
- **Hecho:** menú de anclas (`sectionNav`), "Datos básicos" dividido en
  Tipo de contenido / Visibilidad / Destacados en el sitio, las 6
  secciones restantes (Imágenes, Especificaciones, Video, Beneficios,
  Manual, Zona de peligro) convertidas a `<details id="...">` con
  resumen de estado en `<summary>` calculado con datos ya consultados
  (sin queries nuevas). Reglas de apertura: `imagesOpen` (sin fotos o
  tras acción sobre imágenes), `specsOpen` (sin ninguna llena o tras
  guardar), `videoOpen`/`benefitsOpen`/`manualOpen` (tras su acción
  respectiva, o manual vacío en borrador); "Zona de peligro" siempre
  cerrada por defecto. Todo sigue siendo Server Component, sin
  JavaScript — mismo patrón nativo que
  `admin/auditoria/page.tsx:225-226`, evitando una séptima excepción a
  "Server Components por defecto".
- **Verificación:** `pnpm typecheck`/`lint` en verde, tags `<details>`
  balanceados (6/6), build de producción real exitoso. La ruta
  `/admin/productos/[id]` redirige correctamente a `/login` sin
  sesión (guard de middleware intacto). **No se hizo clic real en la
  página como master** — habría requerido escribir una contraseña en
  el formulario de login, y el asistente no maneja contraseñas en
  texto plano ni con las manos, ni siquiera de una cuenta de prueba
  local; el usuario puede verificar interactivamente entrando con su
  sesión.
- **Archivos:** `apps/web/app/(staff)/admin/productos/[id]/page.tsx`.
- **Commit:** pendiente (se hace a continuación).

## Bloqueos

Ninguno.
