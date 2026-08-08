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

**Fase 0 — paso 4.4: home placeholder — Fase 4 completa**

- Home con slogan real y descripción real del negocio (sin datos
  inventados), barra de acento roja dentro del límite del 10% de
  superficie. Con esto, apps/web tiene un esqueleto desplegable completo:
  Next.js 15 + Tailwind v4 + sistema de diseño + Montserrat + logo +
  header/footer + home.

**Fase 0 — paso 5.1: `packages/shared/env.ts`**

- Validación de entorno con Zod, esquemas server/cliente separados según
  el inventario de `19-DEPLOYMENT.md`. Verificado en tres escenarios
  reales (todo ausente, todo presente, una sola variable faltante).
  Deliberadamente no conectado a `apps/web` todavía — no hay secretos
  reales en Vercel; se conecta cuando lleguen (empezando por Supabase en
  la Fase 1).

**Fase 0 — paso 5.2: CI — Fase 5 completa**

- `.github/workflows/ci.yml` con jobs `lint`, `typecheck`, `build` en
  paralelo, disparados en push a `main` y en pull requests. Verificado:
  YAML válido, los tres comandos pasan en verde con `--frozen-lockfile`.

**Fase 0 — pasos 6.1–6.4: ADR 0001–0004**

- Cuatro ADR fundacionales en `docs/adr/`: monorepo con una sola app,
  `packages/core` sin React, Siigo como fuente de precios, umbral
  configurable de cotización.

**Hallazgo:** el repositorio es público en GitHub, contradice `CLAUDE.md`.
Requiere acción manual del usuario — ver `progress/TODO.md`.

**Fase 0 — cierre de la tarea**

**Fase 0 completa a nivel de código.** `apps/web` desplegado en Vercel con
header, logo y home reales; CI en verde en GitHub Actions; ningún secreto
en el repositorio. Tarea movida a
`tasks/done/DONE-fase-0-fundacion-A.md` + `-B.md` (dividida por la regla
de 500 líneas). `docs/21-ROADMAP.md` actualizado: Fase 0 ✅ Listo (código).
Quedan tareas operativas del usuario abiertas en `progress/TODO.md`
(repositorio privado, proyectos Supabase, Cloudflare, secretos en Vercel).

---

## Fase 1 — Identidad y datos (2026-08-08)

**Fase 1 completa.** RLS real y probada — con usuarios reales, en CI, no
solo revisando políticas — en las cinco tablas de identidad (`profiles`,
`companies`, `company_members`, `settings`, `audit_log`). Registro con
consentimiento de tratamiento de datos, login, verificación de correo,
recuperación de contraseña. Trigger `handle_new_user`, Auth Hook con el
claim `user_role`, middleware de rutas por rol. `packages/shared/env.ts`
conectado a `apps/web` por primera vez.

Fases del plan (ver `tasks/done/DONE-fase-1-identidad-datos-*.md` para el
detalle paso a paso):

- **Fase 2** — Esquema de identidad, RLS bloqueada desde el primer commit.
- **Fase 3** — Políticas RLS abiertas una por una, cada una probada con
  usuarios reales antes de seguir a la siguiente tabla.
- **Fase 4** — Script de pruebas de aislamiento (`packages/db/tests/rls/`,
  `signInWithPassword` real, no simulado) integrado a CI como job
  bloqueante (`rls-tests`).
- **Fase 5** — Cliente Supabase en `packages/db`, `env.ts` conectado.
- **Fase 6** — Trigger `handle_new_user`.
- **Fase 7** — Auth Hook `custom_access_token_hook` (claim `user_role`).
- **Fase 8** — `/registro`, `/login`, `/verificar`, `/recuperar`. Primer
  código de frontend real del proyecto.
- **Fase 9** — `middleware.ts`, protección de rutas por rol.
- **Fase 10** — este cierre.

**Bugs reales encontrados y corregidos durante la ejecución** (no solo
en revisión de código — en CI, contra el proyecto real):
- `custom_access_token_hook` sin `security definer` rompía el login de
  cualquier usuario (RLS bloqueaba a `supabase_auth_admin`) — corregido
  antes de que nadie lo pisara en producción, porque `/login` todavía no
  existía cuando se detectó.
- Turborepo filtraba `SUPABASE_SERVICE_ROLE_KEY` del build en CI por no
  estar declarada en `turbo.json` (pasa automático las `NEXT_PUBLIC_*`
  por detección de framework, no las demás).

**Desviaciones documentadas en `progress/DECISIONS.md`:** un solo
proyecto Supabase, `settings` bloqueada por completo, `rls-tests` en
GitHub Actions (con una reversión intermedia y vuelta atrás, decisión
final del usuario), columnas de consentimiento agregadas a `profiles`
sin estar en el esquema documentado originalmente, Siigo/Wompi/Resend/R2
opcionales en `env.ts` hasta que cada integración exista.

**Pendiente, no bloquea el cierre:** Resend con dominio verificado (sin
dominio de producción todavía), confirmación visual con clic real de los
enlaces de correo (verificación, recuperación) — la mecánica es la
oficial de Supabase Auth, probada en su forma HTTP real vía `rls-tests`,
pero el clic en el navegador queda pendiente de un entorno con acceso a
`supabase.co`. `docs/21-ROADMAP.md` actualizado: Fase 1 ✅ Listo.

## 2026-08-08 — Fase 2: catálogo público

**Esquema y RLS:** `categories`, `brands`, `products` (+ vista
`public_products`, sin `price_cop`), `product_images`,
`attribute_definitions`, `product_attributes`, `product_documents` (sin
políticas por diseño, depende de postventa), `contact_messages`. RLS
probada con `set local role anon` real en todas — anónimo nunca ve
precio ni en `products` directo (RLS lo bloquea por completo), la
segunda capa de defensa es `resolvePrice()` en `packages/core`, que la
UI usa siempre en vez de leer `price_cop`.

**`packages/ui`:** primer paquete del monorepo con `.tsx` — 9
componentes extraídos y tokenizados de la home migrada de Stitch
(`Icon`, `Button`/`LinkButton`, `Badge`, `StatItem`, `FeatureCard`,
`AudienceCard`, `CategoryChip`, `TrustItem`, `ProductCard`).

**Home:** reconstruida en Next.js con esos componentes. La franja de
estadísticas de Stitch traía cifras fabricadas (sin fuente real) — se
publicó con placeholder visible (`"—"`) y un `TODO` fechado en el
código, decisión explícita del usuario, no se inventaron números.
**Header global** también auditado contra el navbar de Stitch: se
descartaron los menús desplegables sin submenú real, el ícono de
favoritos (módulo inexistente) y el contador de carrito fabricado.

**Catálogo:** listado con filtros por categoría/marca/atributos
filtrables, paginación keyset (nunca offset), orden restringido a
nombre/más nuevos/relevancia (**nunca precio**, ni con sesión).
Búsqueda de texto completo en español (`search_products`, función SQL
con `ts_rank`). Ficha de producto con especificaciones por categoría y
JSON-LD `schema.org/Product` sin bloque `offers`. Comparador (máx. 3,
misma categoría, selección solo en `localStorage`, nunca persiste).
Página de contacto con formulario real — sin teléfono/dirección
fabricados, porque no hay ninguno real todavía en los documentos del
proyecto. `sitemap.xml`/`robots.txt` reales.

**Bug real encontrado y corregido durante el cierre (checklist de
seguridad, paso 8.3):** el cursor de paginación del listado
concatenaba el nombre del producto directo en el filtro `.or()` de
PostgREST sin escapar — un parámetro `after` forjado a mano con comas o
paréntesis podía alterar la sintaxis del filtro compuesto. No escalaba
privilegios (la fuente ya es `public_products`, sin precio, sin datos
sensibles), pero no estaba saneado. Corregido citando el valor según la
sintaxis de PostgREST (`apps/web/app/(public)/catalogo/{page.tsx,
cursor.ts}`) antes de cerrar la tarea.

**Desviación documentada:** `search_products` y `contact_messages`
salieron del alcance original del esquema (`04-DATABASE-SCHEMA-B.md`,
`05-RLS-SECURITY.md`) — se agregaron sobre la marcha, documentadas en
el mismo commit que el código, siguiendo la regla de "documentar antes
de codear" aplicada al descubrimiento, no a la anticipación perfecta.

**Pendiente, no bloquea el cierre:** cifras reales de la franja de
estadísticas del home, inventario real de productos y categorías
(`progress/TODO.md`). `docs/21-ROADMAP.md` actualizado: Fase 2 ✅ Listo.
