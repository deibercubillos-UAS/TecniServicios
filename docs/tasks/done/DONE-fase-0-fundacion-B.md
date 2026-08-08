# TAREA: Fase 0 — Fundación (B: bitácora, bloqueos, pendientes)

Objetivo, documentos consultados y plan completo en
[`DONE-fase-0-fundacion-A.md`](./DONE-fase-0-fundacion-A.md).

**Estado:** Completada · **Riesgo:** Grande
**Inicio:** 2026-08-08 · **Última actualización:** 2026-08-08

## Bitácora

### 2026-08-08 — paso 1.1

- **Hecho:** creado el esqueleto raíz del monorepo: `pnpm-workspace.yaml`
  (packages `apps/*` y `packages/*`), `turbo.json` (tasks `build`, `dev`,
  `lint`, `typecheck`), `package.json` raíz (scripts delegados a Turborepo,
  `engines.node >=20.9.0`, `packageManager: pnpm@10.33.0`) y `.nvmrc` (`22`,
  coincide con el entorno de desarrollo actual).
- **Archivos:** `pnpm-workspace.yaml`, `turbo.json`, `package.json`, `.nvmrc`.
- **Resultado:** verificación OK. `pnpm install` corrió sin error (workspace
  vacío de apps/packages todavía) e instaló Turborepo `2.10.9` como
  devDependency. `node_modules/` y `.turbo/` quedaron ignorados por el
  `.gitignore` ya existente; `pnpm-lock.yaml` se generó y se versiona.
- **Commit:** `chore(setup): inicializa monorepo Turborepo con pnpm`

### 2026-08-08 — paso 1.2, 1.3 y 1.4 (packages/config)

- **Hecho:** creado `packages/config` con la configuración compartida de
  TypeScript estricto, ESLint (flat config) y Prettier:
  - `tsconfig.base.json` — estricto (`strict`, `noUncheckedIndexedAccess`,
    `exactOptionalPropertyTypes`, etc.), pensado para extenderse, no para
    compilar directo (`files: []`).
  - `tsconfig.nextjs.json` — extiende la base y añade `lib: DOM`, `jsx`,
    `allowJs`, `noEmit`, plugin `next`.
  - `eslint/base.mjs` — flat config con `typescript-eslint` recomendado más
    `@typescript-eslint/no-explicit-any: error` (regla de oro de
    `CLAUDE.md`), `consistent-type-imports` y `no-console` limitado a
    `warn`/`error`.
  - `prettier.json` — `singleQuote: false`, `trailingComma: all`,
    `printWidth: 90`. Referenciado desde el campo `"prettier"` del
    `package.json` raíz.
  - Se agregó `@tecni/config` como `devDependency` (`workspace:*`) del
    `package.json` raíz para que la resolución de Node encuentre
    `@tecni/config/prettier.json`.
- **Archivos:** `packages/config/package.json`, `packages/config/tsconfig.base.json`,
  `packages/config/tsconfig.nextjs.json`, `packages/config/eslint/base.mjs`,
  `packages/config/prettier.json`, `package.json` (raíz, actualizado).
- **Resultado:** verificación OK.
  - `tsc --showConfig` sobre `tsconfig.nextjs.json` resuelve con todos los
    flags estrictos heredados de la base (confirmado con salida completa).
    `tsconfig.base.json` solo falla si se invoca *directamente* (`files: []`
    es intencional: es un archivo para extender, no para compilar); se
    verificó que un `tsconfig.json` de prueba que lo extiende compila y
    tipa-chequea en verde.
  - `eslint` con la config base detectó correctamente `@typescript-eslint/no-explicit-any`
    como error y `no-console` como warning en un archivo de prueba.
  - `prettier --check` con la config compartida detectó comillas simples
    como violación de `singleQuote: false` en un archivo de prueba, y pasó
    en verde sobre el propio `packages/config`.
  - `pnpm typecheck` y `pnpm lint` en la raíz: verde (0 tareas, esperado —
    `@tecni/config` todavía no define scripts propios de esos nombres).
- **Commit:** `chore(setup): agrega packages/config con TS estricto, ESLint y Prettier compartidos`

### 2026-08-08 — paso 2.1 (packages/core)

- **Hecho:** creado `packages/core` (`package.json`, `tsconfig.json` que
  extiende `@tecni/config/tsconfig.base.json`, `eslint.config.mjs` que
  extiende `@tecni/config/eslint/base`, `src/index.ts` con un único export
  placeholder y un comentario explicando por qué está vacío — sin lógica de
  negocio ni dependencias de React, según `01-ARCHITECTURE.md` sección 3).
  Scripts `typecheck` y `lint` propios del paquete.
- **Bug encontrado y corregido:** `tsc --noEmit` fallaba con
  `TS6053: File '@tecni/config/tsconfig.base.json' not found` aunque el
  archivo existía físicamente en `node_modules/@tecni/config/`. Causa: el
  `"exports"` de `packages/config/package.json` no incluía las rutas
  `./tsconfig.base.json` ni `./tsconfig.nextjs.json`, y el campo `exports`
  encapsula el paquete — bloquea cualquier ruta no listada aunque el archivo
  exista. Corrección: se agregaron ambas rutas a `exports`.
- **Archivos:** `packages/core/package.json`, `packages/core/tsconfig.json`,
  `packages/core/eslint.config.mjs`, `packages/core/src/index.ts`,
  `packages/config/package.json` (corrección de `exports`).
- **Resultado:** verificación OK. `pnpm --filter @tecni/core typecheck` y
  `lint` pasan; `pnpm typecheck`/`pnpm lint` en la raíz corren ambos
  paquetes vía Turborepo, 2/2 exitosos.
- **Commit:** `chore(core): crea packages/core vacío y corrige exports de packages/config`

### 2026-08-08 — paso 2.2 (packages/db)

- **Hecho:** creado `packages/db` con el mismo patrón que `packages/core`
  (`package.json`, `tsconfig.json` extendiendo `@tecni/config`,
  `eslint.config.mjs`, `src/index.ts` placeholder). Sin migraciones ni
  esquema — eso es Fase 1, documentado en el comentario del propio archivo.
- **Archivos:** `packages/db/package.json`, `packages/db/tsconfig.json`,
  `packages/db/eslint.config.mjs`, `packages/db/src/index.ts`.
- **Resultado:** verificación OK. `pnpm --filter @tecni/db typecheck` y
  `lint` pasan; `pnpm typecheck`/`pnpm lint` en la raíz corren 2/2 paquetes
  vía Turborepo (uno cacheado).
- **Commit:** `chore(db): crea packages/db vacío`

### 2026-08-08 — paso 2.3 (packages/ui)

- **Hecho:** creado `packages/ui` con el mismo patrón (`package.json`,
  `tsconfig.json`, `eslint.config.mjs`, `src/index.ts` placeholder). Sin
  componentes todavía — extiende `tsconfig.base.json` (no el de Next) porque
  todavía no hay JSX; se revisará cuando lleguen los primeros componentes
  reales (Fase 2 del roadmap, migración desde Stitch).
- **Archivos:** `packages/ui/package.json`, `packages/ui/tsconfig.json`,
  `packages/ui/eslint.config.mjs`, `packages/ui/src/index.ts`.
- **Resultado:** verificación OK. `pnpm --filter @tecni/ui typecheck`/`lint`
  pasan; raíz en verde, 3/3 paquetes vía Turborepo (2 cacheados).
- **Commit:** `chore(ui): crea packages/ui vacío`

### 2026-08-08 — paso 2.4 (packages/integrations)

- **Hecho:** creado `packages/integrations` con el mismo patrón. Sin
  clientes de Siigo/Wompi/Resend/R2 todavía — llegan junto con cada
  integración documentada (`08`, `09`, `10`, `11`), a partir de la Fase 1.
- **Archivos:** `packages/integrations/package.json`, `tsconfig.json`,
  `eslint.config.mjs`, `src/index.ts`.
- **Resultado:** verificación OK. `pnpm --filter @tecni/integrations
  typecheck`/`lint` pasan; raíz en verde, 4/4 paquetes (3 cacheados).
- **Commit:** `chore(integrations): crea packages/integrations vacío`

### 2026-08-08 — paso 2.5 (packages/shared) — cierra Fase 2

- **Hecho:** creado `packages/shared` con el mismo patrón. Sin `env.ts`
  todavía — llega en el paso 5.1 de esta misma tarea. Con esto quedan los
  cinco paquetes de dominio (`core`, `db`, `ui`, `integrations`, `shared`)
  creados y verificados.
- **Archivos:** `packages/shared/package.json`, `tsconfig.json`,
  `eslint.config.mjs`, `src/index.ts`.
- **Resultado:** verificación OK. `pnpm --filter @tecni/shared
  typecheck`/`lint` pasan; raíz en verde, **5/5 paquetes** vía Turborepo (4
  cacheados). Fase 2 completa.
- **Commit:** `chore(shared): crea packages/shared vacío — cierra Fase 2`

### 2026-08-08 — paso 3.1 (apps/web: Next.js 15 + React 19)

- **Hecho:** inicializado `apps/web` a mano (no `create-next-app`, para
  respetar la estructura exacta de `01-ARCHITECTURE.md` sección 8):
  - `package.json` con `next@15.5.23` (última estable de la línea 15, no
    16), `react`/`react-dom@^19.2.0`.
  - `tsconfig.json` extiende `@tecni/config/tsconfig.nextjs.json`.
  - `next.config.ts` mínimo.
  - `eslint.config.mjs` extiende la base compartida; ignora `.next/**` y
    `next-env.d.ts` (generado por Next, siempre usa triple-slash reference,
    no se edita a mano).
  - `app/layout.tsx` — layout raíz mínimo (sin fuente ni header/footer
    todavía, eso es Fase 4).
  - `app/(public)/page.tsx` — página placeholder por defecto.
  - Grupos de rutas base sin handlers: `app/(auth)/`, `app/(customer)/`,
    `app/(staff)/`, `app/api/v1/` (con `.gitkeep`, ya que git no versiona
    directorios vacíos). `middleware.ts` se difiere a la Fase 1: sin roles
    ni auth todavía no habría nada real que validar.
  - `components/.gitkeep` — carpeta para componentes propios de la app.
  - `public/brand/README.md` — explica qué archivos de logo van ahí.
- **Archivos:** los listados arriba, todos bajo `apps/web/`.
- **Resultado:** verificación OK. `pnpm --filter web build` compiló en
  verde (`✓ Compiled successfully`, 4 rutas generadas). `typecheck` y
  `lint` de `apps/web` en verde (se corrigió sobre la marcha un falso
  positivo de ESLint contra `next-env.d.ts`, ver Pendientes). Root
  `pnpm typecheck`/`lint`/`build`: 6/6 paquetes en verde vía Turborepo.
- **Commit:** `feat(web): inicializa apps/web con Next.js 15 y React 19`

### 2026-08-08 — paso 3.2 (Tailwind CSS v4)

- **Hecho:** instalado y conectado Tailwind CSS v4 en `apps/web`:
  `@tailwindcss/postcss` + `postcss` como devDependencies,
  `postcss.config.mjs` con el plugin, `app/globals.css` con
  `@import "tailwindcss";` (sintaxis v4), importado desde `app/layout.tsx`.
  Sin tokens propios todavía — eso es el paso 3.3.
- **Archivos:** `apps/web/package.json` (deps), `apps/web/postcss.config.mjs`,
  `apps/web/app/globals.css`, `apps/web/app/layout.tsx` (import del CSS).
- **Resultado:** verificación OK. Se agregaron temporalmente las clases
  `p-6 underline` a la home placeholder, se corrió `pnpm --filter web build`,
  y se confirmó en el CSS generado (`.next/static/css/*.css`) que
  `.underline` y `.p-6{padding:calc(var(--spacing) * 6)}` existen — prueba
  de que Tailwind v4 compila de verdad, no solo que el build no truena. Se
  revirtieron esas clases de prueba (el contenido real de la home es la
  Fase 4). Build/typecheck/lint en verde, 6/6 paquetes.
- **Commit:** `feat(web): configura Tailwind CSS v4`

### 2026-08-08 — paso 3.3 (tokens de diseño en globals.css)

- **Hecho:** traducidos a `app/globals.css` todos los tokens de
  `02-DESIGN-SYSTEM.md` sección 1: la paleta cruda (`--tecni-red`,
  `--tecni-black`, `--tecni-graphite`, `--tecni-steel`, `--tecni-light`,
  `--tecni-white`) y los roles semánticos (`--brand*`, `--bg*`,
  `--surface*`, `--text*`, `--border*`, `--success`, `--warning`,
  `--danger`, `--info`), copiados literalmente del bloque CSS del propio
  documento. Se preservó el comentario sobre `--text-muted` (por qué
  `#A7A9AC` no se usa como texto sobre fondo claro).
- **Archivos:** `apps/web/app/globals.css`.
- **Resultado:** verificación OK, no solo visual. Se extrajeron con
  `grep -oE` todos los hex del documento y todos los hex de `globals.css`,
  se normalizaron a minúsculas y se compararon como conjuntos: **14 valores
  únicos en ambos lados, exactamente los mismos** — ningún hex agregado,
  omitido ni alterado. Se confirmó además que `--brand:#d71920` y
  `--tecni-red` aparecen literalmente en el CSS compilado por Next
  (`.next/static/css/*.css`). Build/typecheck/lint en verde, 6/6 paquetes.
- **Commit:** `feat(web): agrega tokens de diseño a globals.css`

### 2026-08-08 — paso 3.4 (mapeo a Tailwind v4) — cierra Fase 3

- **Hecho:** agregado un bloque `@theme` en `globals.css` que mapea los
  tokens a la convención de nombres de Tailwind v4:
  - Colores: `--color-*` alias vía `var(--brand)`, `var(--bg-alt)`, etc. —
    el valor real sigue viviendo solo en el `:root` del paso 3.3 (una sola
    fuente de verdad).
  - Radios y sombras (sección 3 del doc): declarados directamente en
    `@theme` porque los nombres del documento (`--radius`, `--radius-sm`,
    `--shadow-lg`, ...) ya coinciden con la convención de espacio de
    nombres que Tailwind v4 espera.
  - Espaciado y breakpoints: **no se redeclararon**. Verificado que los
    valores por defecto de Tailwind v4 (escala de `--spacing: 0.25rem` =
    4px, y breakpoints `sm 640/md 768/lg 1024/xl 1280/2xl 1536`) coinciden
    exactamente con la sección 3 del documento — redeclararlos habría sido
    duplicación sin efecto.
- **Archivos:** `apps/web/app/globals.css`.
- **Resultado:** verificación OK, con clases de prueba temporales
  (`rounded-lg bg-brand text-text-inverse shadow-lg`) en la home,
  confirmando en el CSS compilado:
  - `.bg-brand{background-color:var(--color-brand)}` y
    `--color-brand:var(--brand)` → resuelve a `#d71920`.
  - `.rounded-lg{border-radius:var(--radius-lg)}` y `--radius-lg:8px` →
    coincide con el doc.
  - `.shadow-lg{...0 8px 24px ...#11111124...}` → mismo valor que
    `rgba(17,17,17,.14)` del doc (Tailwind lo codifica como hex+alpha).
  Se revirtieron las clases de prueba. Build/typecheck/lint en verde, 6/6
  paquetes. **Fase 3 completa.**
- **Commit:** `feat(web): mapea tokens de diseño a Tailwind v4 — cierra Fase 3`

### 2026-08-08 — logos subidos por el usuario (fuera del plan, previo al 4.2)

- Usuario subió `logo-full-dark.png` y `logo-mark.png` vía GitHub web UI.
  Nombres llegaron con doble extensión (`logo-full-dark.png.png`,
  `logo-mark.png.png`) — corregido en commit `fix(web): corrige nombres
  de archivos de logo`. Falta `logo-full-light.png`.
- Usuario indicó que los íconos (`favicon.ico`, `icon.png`,
  `apple-icon.png`) los genero/descargo yo durante el desarrollo del
  frontend — no bloquean nada de la Fase 0.

### 2026-08-08 — paso 4.1 (Montserrat)

- **Hecho:** cargada Montserrat con `next/font/google` en
  `app/layout.tsx`, config exacta del doc (`subsets: ["latin"]`,
  `weight: ["400","500","600","700","800"]`,
  `variable: "--font-montserrat"`, `display: "swap"`). Se agregó
  `--font-sans: var(--font-montserrat), sans-serif;` al `@theme` de
  `globals.css` para exponerla como utilidad Tailwind (`font-sans`), y se
  aplicó `className="font-sans"` en `<body>`.
- **Archivos:** `apps/web/app/layout.tsx`, `apps/web/app/globals.css`.
- **Resultado:** verificación OK, contra el HTML prerenderizado real
  (`.next/server/app/index.html`), no solo el código fuente:
  `<html class="__variable_...">` (variable de la fuente presente),
  `<body class="font-sans">`. En el CSS compilado:
  `@font-face{...font-display:swap...}` y
  `.font-sans{font-family:var(--font-sans)}`. Build/typecheck/lint en
  verde, 6/6 paquetes.
- **Commit:** `feat(web): carga Montserrat con next/font/google`

### 2026-08-08 — Stitch de referencia subidos por el usuario (fuera del plan)

- Usuario subió 8 pantallas exportadas de Google Stitch a
  `design/stitch/{pantalla}/` (`DESIGN.md` + `code.html` + `screen.png`
  cada una): `home`, `catalogo`, `ficha de producto`, `Comparador`,
  `Login`, `Registro`, `carrito`, `carrito flotante`, `Calendario`.
  Material de referencia, no se compila (ver `design/stitch/README.md` y
  `docs/17-STITCH-MIGRATION.md`). No entra en el alcance de la Fase 0 —
  la migración real empieza en la Fase 2 del roadmap.
- Usuario indicó: el menú de navegación usado en toda la web será el que
  aparece en la pantalla `home` de Stitch, como base. Anotado para cuando
  se migre esa pantalla (Fase 2), no aplica a la home placeholder de hoy.

### 2026-08-08 — paso 4.2 (punto de control — logo)

- **Hecho:** verificados los tres archivos en `apps/web/public/brand/`:
  `logo-full-dark.png` (1536×1024), `logo-full-light.png` (2528×1684),
  `logo-mark.png` (514×576) — los tres PNG reales (`file` los confirma,
  no solo la extensión). Se borró `apps/web/public/brand/README.md`
  (placeholder que decía qué archivos iban ahí, ya innecesario).
- **Archivos:** `apps/web/public/brand/README.md` (eliminado).
- **Resultado:** verificación OK, los tres logos existen y son PNG
  válidos. `logo-full-light.png` pesa 5.8 MB — anotado en Pendientes
  descubiertos para optimizar antes de usarlo en producción (Next
  `<Image>` lo redimensiona en runtime, pero el peso del archivo fuente
  igual conviene bajarlo).
- **Commit:** `chore(web): confirma logos y limpia placeholder de brand/`

### 2026-08-08 — paso 4.3 (header/footer)

- **Hecho:** creados `components/site-header.tsx` y
  `components/site-footer.tsx`, montados en `app/layout.tsx`. Header:
  logo (`logo-full-dark.png`, la variante pensada para fondo oscuro —
  header/footer usan `--bg-inverse`, negro, por uso documentado de
  `--tecni-black`) + navegación mínima a `/catalogo` y `/contacto` (rutas
  reales planeadas en la arquitectura, no inventadas — aún no existen como
  páginas, es esperado). Footer: isotipo (`logo-mark.png`), slogan real,
  copyright con año dinámico. Solo tokens/clases Tailwind mapeadas — cero
  hex en componentes.
- **Archivos:** `apps/web/components/site-header.tsx`,
  `apps/web/components/site-footer.tsx`, `apps/web/app/layout.tsx`.
- **Resultado:** verificación OK. `grep -rn "#[0-9a-fA-F]\{3,6\}"` sobre
  `app/` y `components/` no encontró ningún hex. En el CSS compilado:
  `.bg-bg-inverse{background-color:var(--color-bg-inverse)}` y
  `--color-bg-inverse:var(--bg-inverse)` (→ `#111111`). En el HTML
  prerenderizado: header y footer presentes con el logo real y el nav
  real, no placeholders. Build/typecheck/lint en verde, 6/6 paquetes.
- **Nota:** usé `text-sm`/`text-xs` de Tailwind (no la escala completa de
  tipografía del doc — `body-sm`, `caption`, etc. — porque esos tokens no
  se mapearon a `@theme` en el paso 3.4, que se limitó a color/radius/
  shadow/spacing/breakpoints). Anotado en Pendientes descubiertos.
- **Commit:** `feat(web): agrega header y footer con logo real`

### 2026-08-08 — paso 4.4 (home placeholder) — cierra Fase 4

- **Hecho:** reescrita `app/(public)/page.tsx` con contenido real, no
  inventado: overline "Tecni Equipos y Servicios SAS", `h1` con el
  slogan real ("Soluciones que construyen confianza"), párrafo con la
  descripción real del negocio (tomada de `CLAUDE.md` sección 1:
  maquinaria, herramientas, repuestos y consumibles automotrices —
  alineación, balanceo, elevación, diagnóstico, lubricación). Barra de
  acento roja de 4px (`border-l-4 border-brand`) sobre fondo
  `bg-bg-alt`, muy por debajo del límite del 10% de superficie del doc.
  Sin CTA de catálogo/cotización — esas páginas no existen todavía, un
  botón roto sería peor que ninguno.
- **Archivos:** `apps/web/app/(public)/page.tsx`.
- **Resultado:** verificación OK. `grep` de hex en `app/`+`components/`:
  ninguno. HTML prerenderizado contiene el slogan real textualmente (no
  el placeholder anterior). Build/typecheck/lint en verde, 6/6 paquetes.
  **Fase 4 completa.**
- **Commit:** `feat(web): construye la home placeholder — cierra Fase 4`

### 2026-08-08 — paso 5.1 (packages/shared/env.ts)

- **Hecho:** implementado `packages/shared/src/env.ts` con dos esquemas
  Zod separados (`serverSchema` con las 20 variables del inventario
  completo de `19-DEPLOYMENT.md` sección 4; `clientSchema` solo con las 4
  públicas, enumeradas una por una desde `process.env`, nunca pasando el
  objeto completo). Ambos se parsean al importar el módulo (`safeParse` +
  `throw` con mensaje que nombra cada variable inválida/faltante, no un
  `ZodError` crudo).
- **Archivos:** `packages/shared/src/env.ts`, `packages/shared/package.json`
  (agrega `zod` y `@types/node`).
- **Decisión (desviación del plan, anotada en vivo):** `env.ts` **no se
  importa desde `apps/web` en este paso**. Ninguna de las 20 variables
  (Supabase, Siigo, Wompi, Resend, R2) existe todavía en Vercel — están
  registradas como bloqueantes en `docs/progress/TODO.md`. Si se
  importara ahora, el build de `apps/web` (que hoy despliega en verde)
  se rompería hasta que el usuario cargue ~20 secretos para
  integraciones que ni siquiera están construidas. Se prioriza no romper
  el despliegue actual. Se conecta cuando existan los primeros secretos
  reales (naturalmente, con Supabase en la Fase 1).
- **Resultado:** verificación OK, no solo de tipos — se corrió el módulo
  de verdad con `node --experimental-strip-types` en tres escenarios:
  (1) todas las variables ausentes → lanza y nombra las 20; (2) todas
  presentes (valores de prueba) → `serverEnv`/`clientEnv` resuelven
  correctamente; (3) falta solo `R2_PUBLIC_URL` → el mensaje nombra
  exactamente esa variable, ninguna otra. `pnpm typecheck`/`lint` en
  verde (tuvo que corregirse `noPropertyAccessFromIndexSignature` con
  notación de corchetes en el acceso a `process.env` del cliente).
  `pnpm build` de `apps/web` sigue en verde, sin tocar — confirma que la
  decisión de no conectar `env.ts` todavía no rompió nada.
- **Commit:** `feat(shared): implementa env.ts con validación Zod`

### 2026-08-08 — paso 5.2 (CI) — cierra Fase 5

- **Hecho:** creado `.github/workflows/ci.yml` con tres jobs paralelos
  (`lint`, `typecheck`, `build`), cada uno: checkout, `pnpm/action-setup`
  (pin `10.33.0`, igual que `packageManager`), `actions/setup-node` con
  `node-version-file: .nvmrc` y caché de pnpm, `pnpm install
  --frozen-lockfile`, y el comando correspondiente. Dispara en push a
  `main` y en cualquier pull request.
- **Archivos:** `.github/workflows/ci.yml`.
- **Resultado:** verificación OK. YAML parseado con `python3 -c
  "import yaml..."` — válido, tres jobs detectados. Los tres comandos
  que ejecutará CI (`pnpm lint`, `pnpm typecheck`, `pnpm build`) se
  corrieron localmente con `pnpm install --frozen-lockfile` primero
  (igual que hará el runner): los tres en verde. **Fase 5 completa.**
  Confirmado además vía API de GitHub tras el push: el workflow
  `CI` corrió de verdad en GitHub Actions con
  `status: completed, conclusion: success`.
- **Commit:** `ci: agrega workflow de lint, typecheck y build — cierra Fase 5`

### 2026-08-08 — hallazgo fuera del plan: repositorio público

- Al verificar el disparo de CI vía API de GitHub, la respuesta mostró
  `"private": false`. Contradice la regla no negociable de `CLAUDE.md` /
  `PROMPTINICIALCLAUDECODE.md` ("El repositorio debe ser privado. No
  negociable" — contiene arquitectura completa, esquema de datos y
  reglas de negocio). No es algo que se pueda corregir vía git/API desde
  esta sesión — se avisó al usuario para que lo cambie en GitHub →
  Settings → General → Change visibility → Private. Registrado también
  en Pendientes descubiertos.

### 2026-08-08 — pasos 6.1 a 6.4 (ADR 0001–0004)

- **Hecho:** escritos los cuatro ADR de `01-ARCHITECTURE.md` sección 9,
  formato estándar (contexto, decisión, consecuencias, alternativas
  descartadas):
  - `ADR-0001-monorepo-single-app.md` — monorepo con una sola app Next.js.
  - `ADR-0002-core-sin-react.md` — lógica de negocio aislada en
    `packages/core`, sin React, para habilitar el APK futuro.
  - `ADR-0003-siigo-fuente-precios.md` — Siigo fuente de precios, web
    fuente de catálogo.
  - `ADR-0004-umbral-cotizacion.md` — umbral configurable de
    $5.000.000 COP.
- **Archivos:** los cuatro en `docs/adr/`.
- **Resultado:** verificación OK. `wc -l` confirma que los cuatro están
  muy por debajo del límite de 500 líneas (55–61 líneas cada uno).
- **Commit:** `docs(adr): agrega ADR 0001 a 0004`

### 2026-08-08 — paso 6.5 (cierre de la tarea)

- **Hecho:** las 22 pasos de las 6 fases completados y verificados.
  Actualizado `docs/21-ROADMAP.md` (Fase 0: ✅ Listo — código), y
  `docs/progress/TODO.md` (ítems de código de Fase 0 marcados, ítems
  operativos del usuario permanecen abiertos: proyectos Supabase, repo
  privado, Cloudflare, entornos de Vercel con secretos, `vercel env
  pull`). Este archivo de tarea se divide en dos (regla de 500 líneas) y
  se mueve a `docs/tasks/done/`.
- **Resultado:** Fase 0 completa a nivel de código. `apps/web` desplegado
  en Vercel con header, logo y home reales; CI en verde en GitHub
  Actions (confirmado vía API, no solo local); ningún secreto en el
  repositorio en ningún commit de esta tarea.
- **Commit:** `docs(tasks): cierra la tarea Fase 0 — Fundación`

---

## Bloqueos

_(ninguno — los tres logos ya están en `apps/web/public/brand/`)_

## Pendientes descubiertos

- **Urgente, fuera del alcance de esta sesión:** el repositorio
  `TecniServicios` es público en GitHub. `CLAUDE.md` exige que sea
  privado, sin excepción. El usuario debe cambiarlo manualmente.
- `logo-full-light.png` pesa 5.8 MB (2528×1684). Optimizar/comprimir antes
  de usarlo en producción — no bloquea la Fase 0.
- La escala tipográfica completa de `02-DESIGN-SYSTEM.md` sección 2
  (`display`, `h1`–`h4`, `body-lg`, `body`, `body-sm`, `caption`,
  `overline`, `price`) no está mapeada a `@theme`. Header/footer usan
  `text-sm`/`text-xs` de Tailwind por defecto (valores en px coinciden,
  pero no son los tokens con nombre del doc). Mapear cuando se construyan
  componentes reales de UI (`03-UI-COMPONENTS.md`, Fase 2).
- Proyectos Supabase (`staging`/`prod`), conexión de Vercel y Cloudflare,
  y carga de los tres entornos de variables: son tareas operativas del
  usuario fuera del alcance de esta sesión de código. Ya están en
  `docs/progress/TODO.md` bajo "Bloqueantes" y "Fase 0".
- Credenciales de Siigo, contrato de Wompi, dominio de producción e
  inventario real de productos: ya registrados como `PENDIENTE-DECISIÓN` /
  bloqueantes en `docs/progress/TODO.md`. No se resuelven aquí.
- `next build` avisa "The Next.js plugin was not detected in your ESLint
  configuration" — no rompe el build, solo faltan las reglas específicas
  de Next (`@next/eslint-plugin-next`, ej. `no-img-element`). No estaba en
  el alcance de los pasos 3.1–3.4. Evaluar agregarlo cuando se documenten
  los componentes en `03-UI-COMPONENTS.md`.
