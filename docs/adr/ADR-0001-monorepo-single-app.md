# ADR-0001 — Monorepo Turborepo con una sola app Next.js

Volver a [`00-INDEX.md`](../00-INDEX.md) · Detalle en [`01-ARCHITECTURE.md`](../01-ARCHITECTURE.md)

**Estado:** Aceptada · **Fecha:** 2026-08-08

## Contexto

El proyecto necesita servir cinco superficies muy distintas (catálogo
público, autenticación, dashboard de cliente, paneles de vendedor/técnico,
panel maestro) con un requisito explícito de "frontend aparte del backend"
y de habilitar una futura app móvil (APK) sin reescribir la lógica de
negocio.

La alternativa evidente era separar en varias apps (`apps/web`,
`apps/admin`, quizás `apps/staff`), cada una con su propio despliegue.

## Decisión

Un monorepo Turborepo + pnpm con **una sola aplicación Next.js**
(`apps/web`), que sirve las cinco superficies mediante grupos de rutas
(`(public)`, `(auth)`, `(customer)`, `(staff)`) y expone su API bajo
`app/api/v1/`. La separación frontend/backend no es física (dos
despliegues), sino de capas: el frontend vive en los grupos de rutas, el
backend vive en `api/v1` + `packages/core`.

La seguridad entre estas superficies se garantiza con tres capas
independientes: middleware (valida rol antes de renderizar cualquier ruta
de `(staff)`), reglas de negocio en `packages/core`, y RLS en la base de
datos como última línea de defensa.

## Consecuencias

**Positivas**
- Un solo despliegue, un solo dominio, una sola configuración de Vercel.
- Comparte dependencias, configuración de build y caché de Turborepo.
- Extraer una app de administración separada más adelante no requiere
  reescribir lógica: ya vive en `packages/core`, sin React.

**Negativas / costo asumido**
- La seguridad depende del middleware y de RLS, no del aislamiento físico
  de despliegues. Un error en el middleware no queda contenido por sí
  solo — se compensa con RLS y pruebas de aislamiento obligatorias en CI
  (Fase 1).
- Un bundle más grande si no se gestiona bien el code-splitting por grupo
  de rutas (mitigado por el App Router de Next.js, que ya lo hace por
  ruta).

## Alternativas descartadas

- **Apps separadas por rol** (`apps/web`, `apps/admin`, `apps/staff`):
  más aislamiento, pero duplica configuración de despliegue y complica
  compartir componentes de `packages/ui` entre superficies que sí se
  parecen visualmente. Se puede migrar a esto después sin reescribir
  lógica, si el volumen de tráfico o el equipo lo justifican.
