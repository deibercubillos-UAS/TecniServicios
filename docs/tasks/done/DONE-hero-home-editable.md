# TAREA: Hero del home editable por master (título, descripción, botones opcionales)

**Estado:** Completada · **Riesgo:** Normal
**Inicio:** 2026-08-17 · **Última actualización:** 2026-08-17

## Objetivo

El master ya podía editar la foto del hero (`/admin/banners`). Falta el
panel de texto fijo (título, descripción, 2 botones) — hoy hardcodeado
en `hero-carousel.tsx`. Se reusa el sistema genérico de `settings`
(`/admin/configuracion`), sin tocar `banners`.

Plan completo: `/Users/deiber/.claude/plans/robust-humming-hippo.md`.

## Plan

- [x] **1.1** Migración: 8 settings `home_hero_*` sembradas con el copy
      actual + política de lectura pública.
- [x] **2.1** `settings-config.ts`: tipos `boolean`/`textarea` + sección
      nueva.
- [x] **2.2** `admin/configuracion/page.tsx`: render checkbox/textarea.
- [x] **2.3** `admin/configuracion/actions.ts`: parseo boolean/textarea.
- [x] **3.1** `app/(public)/page.tsx`: trae settings, pasa a
      `HeroCarousel`.
- [x] **3.2** `hero-carousel.tsx`: usa las props en vez de JSX
      hardcodeado.

## Bitácora

### 2026-08-17 — Inicio
- Plan aprobado. Empezando Fase 1.

### 2026-08-17 — Completa
- **Hecho:** 8 settings `home_hero_*` sembradas con el copy original
  (sin regresión) + política `settings_read_home_hero_public` (lectura
  acotada por prefijo, mismo patrón que `contact_%`). Sistema genérico
  de `/admin/configuracion` ganó tipos `boolean` (checkbox + truco de
  hidden-después-en-el-DOM para que un formulario parcial no pierda el
  valor al desmarcar) y `textarea`. Nueva sección "Hero del home" con
  título, descripción y 2 botones (texto+enlace+on/off cada uno).
  `hero-carousel.tsx` reemplaza el JSX hardcodeado por estas props; con
  un botón apagado no queda hueco vacío, con los dos apagados
  desaparece la fila completa.
- **Decisión de diseño documentada:** se pierde el resaltado en rojo de
  "confianza" dentro del título (era un `<span>` partido a mano) — un
  campo de texto plano no puede preservar resaltado parcial sin
  mini-lenguaje de marcado, fuera de alcance. Título en un solo color.
- **Verificación:** `pnpm typecheck`/`lint` en verde, `get_advisors`
  sin hallazgos nuevos. Build de producción real: `/` sin tocar nada se
  ve igual que antes (copy sembrado idéntico). Prueba extremo a extremo
  simulando una edición vía SQL directa (cambiar título + apagar botón
  2): el home reflejó el cambio al recargar, sin hueco visual donde
  estaba el botón apagado; datos de prueba revertidos al cerrar.
- **Commit:** pendiente (se hace a continuación).

## Bloqueos

Ninguno.
