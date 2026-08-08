# Tareas

Índice de tareas. Metodología completa en [`../23-TASK-EXECUTION.md`](../23-TASK-EXECUTION.md).

**Solo puede haber un `ACTIVE-*.md` a la vez.**

---

## En curso

- [`ACTIVE-fase-2-catalogo-publico-A.md`](./ACTIVE-fase-2-catalogo-publico-A.md) +
  [`-B.md`](./ACTIVE-fase-2-catalogo-publico-B.md) —
  Fase 2: catálogo público, RLS sin precios para anónimos, home migrado
  de Stitch, listado, búsqueda, ficha, comparador.

## Completadas

- [`done/DONE-fase-1-identidad-datos-A.md`](./done/DONE-fase-1-identidad-datos-A.md) +
  [`-B.md`](./done/DONE-fase-1-identidad-datos-B.md) +
  [`-C.md`](./done/DONE-fase-1-identidad-datos-C.md) +
  [`-D.md`](./done/DONE-fase-1-identidad-datos-D.md) — Fase 1: RLS real
  probada en las 5 tablas de identidad, registro/login/verificación/
  recuperación, trigger de perfil, Auth Hook, middleware por rol.
  Completada 2026-08-08.
- [`done/DONE-fase-0-fundacion-A.md`](./done/DONE-fase-0-fundacion-A.md) +
  [`-B.md`](./done/DONE-fase-0-fundacion-B.md) — Fase 0: monorepo,
  `apps/web` (Next.js 15 + Tailwind v4 + sistema de diseño), paquetes
  vacíos, CI en verde, `env.ts`, ADR 0001–0004. Completada 2026-08-08.

---

## Cómo usar esta carpeta

1. Al acordar una tarea, se crea `ACTIVE-{slug}.md` con el plan completo, usando
   la plantilla de la sección 4 de `23-TASK-EXECUTION.md`.
2. Se registra aquí, en "En curso".
3. Al terminar cada paso: se marca, se anota en la bitácora, se publica.
4. Al completarla: se mueve a `done/DONE-{slug}.md`, se pasa a "Completadas" y se
   actualiza `../progress/CHANGELOG.md`.

## Al retomar el trabajo

Lee el `ACTIVE-*.md` completo antes de escribir código. Contiene el plan, las
decisiones tomadas y la bitácora de lo ya hecho. **Retoma desde el primer paso sin
marcar**, no desde donde creas recordar.
