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

**Fase 0 — pasos 1.2–1.4: `packages/config`**

- `packages/config` — TypeScript estricto compartido (`tsconfig.base.json`,
  `tsconfig.nextjs.json`), ESLint flat config compartido
  (`eslint/base.mjs`) y Prettier compartido (`prettier.json`), referenciado
  desde el `package.json` raíz.

**Fase 0 — paso 2.1: `packages/core`**

- `packages/core` — paquete vacío de lógica de negocio (sin React, sin
  dependencias de Next.js), listo para la Fase 1.

**Fase 0 — paso 2.2: `packages/db`**

- `packages/db` — paquete vacío para esquema, migraciones y tipos de
  Supabase, listo para la Fase 1.

**Fase 0 — paso 2.3: `packages/ui`**

- `packages/ui` — paquete vacío del design system, sin componentes todavía.

**Fase 0 — paso 2.4: `packages/integrations`**

- `packages/integrations` — paquete vacío para los clientes de Siigo, Wompi,
  Resend y R2, listo para la Fase 1.

**Fase 0 — paso 2.5: `packages/shared` — Fase 2 completa**

- `packages/shared` — paquete vacío para tipos y esquemas Zod compartidos;
  aquí vivirá `env.ts`. Con esto, los cinco paquetes de dominio
  (`core`, `db`, `ui`, `integrations`, `shared`) quedan creados.

**Fase 0 — paso 3.1: `apps/web` (Next.js 15 + React 19)**

- `apps/web` — app Next.js 15 (App Router) con TypeScript estricto,
  estructura de grupos de rutas (`(public)`, `(auth)`, `(customer)`,
  `(staff)`, `api/v1`) según `01-ARCHITECTURE.md`. Layout raíz y home
  placeholder mínimos; sin tokens de diseño, fuente ni logo todavía
  (Fase 4). `pnpm build`/`typecheck`/`lint` en verde.

**Fase 0 — paso 3.2: Tailwind CSS v4**

- Tailwind CSS v4 conectado en `apps/web` (`postcss.config.mjs`,
  `app/globals.css`). Verificado con clases de utilidad de prueba
  reflejadas en el CSS generado; sin tokens propios todavía (paso 3.3).

**Fase 0 — paso 3.3: tokens de diseño en `globals.css`**

- Paleta cruda y roles semánticos de `02-DESIGN-SYSTEM.md` sección 1,
  traducidos literalmente a variables CSS en `app/globals.css`. Verificado
  que el conjunto de hex coincide exactamente con el documento (14/14).

**Fase 0 — paso 3.4: tokens mapeados a Tailwind v4 — Fase 3 completa**

- `@theme` en `globals.css` mapea colores (alias a los tokens del `:root`),
  radios y sombras de la sección 3. Espaciado y breakpoints no se
  redeclaran: los valores por defecto de Tailwind v4 ya coinciden con el
  documento. Con esto, `apps/web` tiene Next.js 15 + Tailwind v4 + el
  sistema de diseño completo.

**Fase 0 — paso 4.1: Montserrat**

- Fuente Montserrat cargada con `next/font/google`, config exacta del
  documento, expuesta como `font-sans` de Tailwind. `logo-full-dark.png`
  y `logo-mark.png` recibidos; falta `logo-full-light.png`.

**Fase 0 — paso 4.2: logo completo**

- `logo-full-light.png` recibido. Los tres logos verificados en
  `apps/web/public/brand/`. Placeholder `README.md` de esa carpeta
  eliminado.
- 8 pantallas de Google Stitch subidas a `design/stitch/` como material
  de referencia (Fase 2 las migra, no esta tarea).

**Fase 0 — paso 4.3: header y footer**

- `SiteHeader`/`SiteFooter` con el logo real, navegación mínima y slogan.
  Solo tokens del sistema de diseño, cero hex en componentes (verificado
  con grep).
