# Changelog

Registro de lo construido. Formato: `## YYYY-MM-DD` con lo entregado ese día.

---

## 2026-08-07

**Documentación inicial del proyecto**

- `CLAUDE.md` — documento maestro con reglas de oro y reglas de negocio
- `docs/00-INDEX.md` — índice y estado de todos los documentos
- `docs/01-ARCHITECTURE.md` — monorepo Turborepo, separación frontend/backend
- `docs/02-DESIGN-SYSTEM.md` — paleta tokenizada, Montserrat, componentes base
- `docs/04-DATABASE-SCHEMA-A.md` y `-B.md` — esquema completo con atributos por categoría (dividido por la regla de 500 líneas)
- `docs/05-RLS-SECURITY.md` — políticas RLS y checklist de seguridad
- `docs/06-AUTH-ROLES.md` — cinco roles y matriz de permisos
- `docs/08-INTEGRATION-SIIGO.md` — contrato de integración y estrategia de fallback
- `docs/17-STITCH-MIGRATION.md` — pipeline de migración desde Google Stitch
- `docs/21-ROADMAP.md` — siete fases con definición de "listo"
- `docs/progress/` — decisiones, TODO y este changelog

- `docs/19-DEPLOYMENT.md` — gestión de secretos en Vercel, entornos, despliegue

- `docs/23-TASK-EXECUTION.md` — metodología de ejecución por fases
- `docs/tasks/` — carpeta de tareas con índice y plantilla

**Metodología de trabajo:** toda tarea se divide en fases y pasos verificables,
con seguimiento en un archivo vivo en `docs/tasks/` que se actualiza al terminar
cada paso, para no perder contexto entre sesiones.

**Política de secretos:** todo valor sensible vive únicamente en Vercel
Environment Variables; el entorno local se sincroniza con `vercel env pull`.

**Política de git:** publicación directa a `main` al terminar cada tarea,
documentada en `CLAUDE.md` sección 10.

**Sin código de aplicación todavía.** Fase 0 en curso.

## 2026-08-08

**Fase 0 — paso 1.1: esqueleto del monorepo**

- `pnpm-workspace.yaml`, `turbo.json`, `package.json` raíz, `.nvmrc` —
  monorepo Turborepo + pnpm inicializado. `pnpm install` verificado en verde.
