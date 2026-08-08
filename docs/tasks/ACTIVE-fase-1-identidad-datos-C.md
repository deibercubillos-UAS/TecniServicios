# TAREA: Fase 1 — Identidad y datos (parte C: bitácora 4.2+, bloqueos, pendientes)

Parte A (plan): [`ACTIVE-fase-1-identidad-datos-A.md`](./ACTIVE-fase-1-identidad-datos-A.md) · Parte B (bitácora pasos 1.1–4.1): [`ACTIVE-fase-1-identidad-datos-B.md`](./ACTIVE-fase-1-identidad-datos-B.md)

## Bitácora (continuación)

### 2026-08-08 — paso 4.2 (replanteado: sin CI, manual)

- **Hecho:** el usuario pidió explícitamente no usar GitHub Actions por
  costo, y que la verificación sea "en producción" — el único proyecto
  Supabase que existe. Se quitó el job `rls-tests` que se había
  agregado a `.github/workflows/ci.yml` (quedan `lint`/`typecheck`/
  `build`, sin cambios). `docs/18-TESTING.md` sección 3 actualizada:
  `rls-tests` ya no figura como bloqueante de CI, ahora es un paso
  manual documentado (`pnpm --filter @tecni/db test` local, vía
  `vercel env pull`). Registrada la desviación en
  `docs/progress/DECISIONS.md` (contradice la versión original de
  `18-TESTING.md` escrita en el paso 1.1 — corregida en el mismo
  commit) con el riesgo asumido explícito: sin bloqueo automático ante
  un push que rompa RLS, la disciplina manual es la única red.
  Pendiente: el usuario corre el script localmente (yo no tengo la
  `service_role` key ni forma de conseguirla en este entorno — sin CLI
  de `vercel` autenticado) y confirma verde/rojo sin compartir el
  valor.
- **Archivos:** `.github/workflows/ci.yml`, `docs/18-TESTING.md`,
  `docs/progress/DECISIONS.md`.
- **Resultado:** cambio de arquitectura de pruebas documentado y
  publicado. Verificación real en verde queda pendiente de que el
  usuario la corra y confirme.
- **Commit:** `ci(rls-tests): revierte a verificación manual, sin GitHub Actions`

### 2026-08-08 — paso 4.2 (segunda reversión: vuelve a CI)

- **Hecho:** el usuario reconsideró — prefiere GitHub Actions para que
  la verificación corra sin depender de que alguien la haga a mano.
  Restaurado el job `rls-tests` en `.github/workflows/ci.yml` (idéntico
  al de la primera versión de este paso), `18-TESTING.md` vuelto a
  "corre en CI, bloquea merge", nueva entrada en `DECISIONS.md`
  registrando la reversión sin borrar la anterior (historial honesto).
  `progress/TODO.md`: agregado como bloqueante cargar los tres GitHub
  Secrets, con recordatorio explícito del usuario de borrarlos más
  adelante si se abandona este flujo.
- **Archivos:** `.github/workflows/ci.yml`, `docs/18-TESTING.md`,
  `docs/progress/DECISIONS.md`, `docs/progress/TODO.md`.
- **Resultado:** pendiente de que el usuario cargue
  `SUPABASE_URL`/`SUPABASE_ANON_KEY`/`SUPABASE_SERVICE_ROLE_KEY` como
  GitHub Secrets. En cuanto estén, se dispara un push de prueba y se
  confirma el verde vía `mcp__github__actions_get`.
- **Commit:** `ci(rls-tests): revierte a CI, GitHub Secrets pendientes`

### 2026-08-08 — paso 4.2 (verificación real en verde)

- **Hecho:** primer intento del usuario cargó los 3 valores como
  **Environment secrets/variables** (scope `Production`) en vez de
  **Repository secrets**; el job no declara `environment: production`,
  así que no los veía (`env: SUPABASE_URL:` vacío en el log). Corregido
  moviéndolos a Repository secrets. Segundo push de prueba
  (`de4df65`): los 4 jobs de CI en verde, incluido "RLS isolation
  tests" (`pnpm --filter @tecni/db test`, corrido contra el proyecto
  real). Confirmado sin residuos tras la corrida:
  `select count(*) from auth.users where email like 'rls-%@tecni.test'`
  → `0`, mismo con `companies`.
- **Archivos:** ninguno (los secrets viven en GitHub, no en el repo).
- **Resultado:** verificación OK, verde real confirmado vía API de
  GitHub Actions (`run_id 31267028838`). Paso 4.2 cerrado del todo —
  cierra también la Fase 4 completa.
- **Commit:** N/A (push vacío de disparo, sin cambios de archivo)

### 2026-08-08 — paso 5.1 (cliente Supabase en @tecni/db)

- **Hecho:** agregado `@supabase/ssr` a `@tecni/db` (ya tenía
  `@supabase/supabase-js` desde el paso 4.1). Escrito
  `packages/db/src/client.ts` con `createBrowserClient` y
  `createServerClient`. Decisión de diseño: `createServerClient` no
  importa `next/headers` — recibe el adaptador `CookieMethodsServer`
  (`getAll`/`setAll`) como parámetro, para que `@tecni/db` no dependa
  de Next, misma regla que `01-ARCHITECTURE.md` aplica a
  `packages/core`. `apps/web` (Fase 8/9) va a pasarle `cookies()` de
  `next/headers` al llamarlo. Exportados ambos desde
  `packages/db/src/index.ts`.
- **Archivos:** `packages/db/package.json`, `packages/db/src/client.ts`,
  `packages/db/src/index.ts`, `pnpm-lock.yaml`.
- **Resultado:** verificación OK. `pnpm --filter @tecni/db typecheck` y
  `lint` pasan; `pnpm typecheck`/`pnpm lint` en la raíz también, sin
  romper nada del resto del monorepo.
- **Commit:** `feat(db): cliente Supabase (createBrowserClient, createServerClient)`

---

### 2026-08-08 — paso 5.2 (env.ts conectado a apps/web)

- **Hecho:** al conectar `env.ts`, `serverSchema` original exigía las
  20 variables del inventario completo (`19-DEPLOYMENT.md`), incluidas
  Siigo/Wompi/Resend/R2 — ninguna existe todavía (bloqueantes en
  `progress/TODO.md`). Conectarlo tal cual habría roto el build de
  producción sin relación con esta tarea. Corregido antes de avanzar
  (no se avanza con un paso roto, regla del flujo): esos cuatro
  bloques + `NEXT_PUBLIC_SITE_URL` pasan a `.optional()` en
  `serverSchema`/`clientSchema`, documentado con comentarios inline y
  registrado en `progress/DECISIONS.md`. Solo Supabase (3 variables)
  queda obligatorio. Agregado `@tecni/shared` como dependencia de
  `apps/web`, creado `apps/web/lib/env.ts` (con `import "server-only"`,
  re-exporta `serverEnv`/`clientEnv`), importado por su efecto lateral
  en `app/layout.tsx` — fuerza la validación en cada arranque del
  servidor.
- **Verificación real, dos escenarios:** `pnpm --filter web build` con
  las 3 variables de Supabase (URL/anon key reales, service role de
  prueba) → build verde, 4 páginas generadas. Mismo build sin
  `SUPABASE_SERVICE_ROLE_KEY` → falla con mensaje claro y accionable
  (`SUPABASE_SERVICE_ROLE_KEY: Invalid input... corre \`vercel env pull
  .env.local\``) — confirma que la validación sigue funcionando donde
  importa, no que quedó desactivada.
- **Coordinación con el usuario:** las 3 variables de Supabase ya están
  en Vercel (confirmado en pasos anteriores de esta tarea), así que
  este commit no debería romper el deploy de producción. Sin
  `NEXT_PUBLIC_SITE_URL` ni las de Siigo/Wompi/Resend/R2 en Vercel, el
  build también debería pasar ahí — son opcionales ahora.
- **Archivos:** `packages/shared/src/env.ts`, `packages/shared/src/index.ts`,
  `apps/web/package.json`, `apps/web/lib/env.ts`, `apps/web/app/layout.tsx`,
  `docs/progress/DECISIONS.md`, `pnpm-lock.yaml`.
- **Resultado:** verificación OK en ambos escenarios. `pnpm typecheck` y
  `pnpm lint` en la raíz también pasan.
- **Commit:** `feat(web): conecta env.ts, Siigo/Wompi/Resend/R2 opcionales hasta su integración`

### 2026-08-08 — paso 5.2 (CI roto por el mismo cambio, corregido)

- **Hecho:** el push de 5.2 rompió el job "Build" de CI (verde en
  local, rojo en GitHub Actions) — `pnpm build` ahí nunca tuvo
  variables de entorno inyectadas (el job de Fase 0 no las necesitaba
  hasta ahora). Con `env.ts` conectado, `apps/web` exige de verdad
  `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY`/
  `SUPABASE_SERVICE_ROLE_KEY` al buildear. Corregido: agregado un
  bloque `env:` al step `pnpm build` en `ci.yml`, reusando los mismos
  Repository Secrets que ya usa `rls-tests` (`SUPABASE_URL` →
  `NEXT_PUBLIC_SUPABASE_URL`, etc. — nombres distintos porque
  `apps/web` necesita el prefijo `NEXT_PUBLIC_`).
- **Archivos:** `.github/workflows/ci.yml`.
- **Resultado:** pendiente de confirmar verde tras el próximo push.
- **Commit:** `ci(build): inyecta variables de Supabase al job Build`

### 2026-08-08 — paso 5.2 (segunda corrección: Turbo filtraba la env var)

- **Hecho:** el fix anterior no alcanzó — CI seguía en rojo, ahora solo
  faltaba `SUPABASE_SERVICE_ROLE_KEY` (las dos `NEXT_PUBLIC_*` sí
  llegaron). Causa real: Turborepo filtra variables de entorno no
  declaradas en `turbo.json` al ejecutar una tarea — pasa automático
  las `NEXT_PUBLIC_*` (detección de framework Next.js integrada), pero
  no una variable server-only sin ese prefijo. Mi verificación local
  de 5.2 había usado `pnpm --filter web build` (sin pasar por Turbo),
  por eso no lo detectó — CI usa `pnpm build` → `turbo run build`, con
  el filtro activo. Corregido: agregado `"env":
  ["SUPABASE_SERVICE_ROLE_KEY"]` a la tarea `build` de `turbo.json`.
  Reverificado local con `pnpm build` (raíz, vía Turbo — misma ruta que
  CI): ya no aparece el error de `env.ts`; el build sí llega a
  compilar (falla después por un problema de red del sandbox al pedir
  Google Fonts, ajeno a esto y no reproducible en el runner de GitHub).
- **Archivos:** `turbo.json`.
- **Resultado:** verificación OK. Los 4 jobs de CI en verde
  (`run_id 31267796332`), incluido "Build". Paso 5.2 cerrado del todo.
- **Commit:** `fix(build): declara SUPABASE_SERVICE_ROLE_KEY en turbo.json`

### 2026-08-08 — paso 6.1 (trigger handle_new_user)

- **Hecho:** aplicada `handle_new_user_trigger` vía `apply_migration`:
  función `handle_new_user()` (`security definer`) + trigger
  `on_auth_user_created` `after insert on auth.users`. Crea la fila en
  `profiles` con `full_name` desde
  `raw_user_meta_data->>'full_name'`, con fallback a la parte local
  del correo si no llega (evita violar el `not null` de
  `profiles.full_name`); `role` siempre `'customer'` por defecto.
  Verificado con `execute_sql`: (1) usuario con `full_name` en
  metadata → `profiles.full_name` correcto, `role = 'customer'`; (2)
  usuario sin metadata → fallback a la parte local del correo. Ambos
  sin excepción, cleanup confirmado (`0` residuos).
- **Efecto colateral corregido en el mismo paso:** el trigger rompía
  `packages/db/tests/rls/helpers.ts` (`createTestUser` insertaba
  manualmente en `profiles` después de `admin.createUser` — ahora
  choca con la fila que el trigger ya creó). Corregido: `createUser`
  pasa `full_name` en `user_metadata` para que el trigger lo use
  directamente; el helper ya no hace `insert`, solo `update` del `role`
  cuando la prueba pide uno distinto de `customer`. Verificado con
  `pnpm --filter @tecni/db typecheck`/`lint`, ambos OK.
- **Archivos:**
  `packages/db/migrations/20260808140000_handle_new_user_trigger.sql`,
  `packages/db/tests/rls/helpers.ts`.
- **Resultado:** verificación OK. Los 4 jobs de CI en verde tras el
  push (`run_id 31267968740`), `rls-tests` incluido con el helper
  corregido — confirma que el trigger no rompió las pruebas de la
  Fase 4. Fase 6 cerrada.
- **Commit:** `feat(db): trigger handle_new_user, ajusta helper de pruebas RLS`

### 2026-08-08 — paso 7.1 (función custom_access_token_hook)

- **Hecho:** aplicada `custom_access_token_hook` vía `apply_migration`
  — patrón estándar de Supabase Auth Hooks: lee `profiles.role` para
  el `user_id` del evento, agrega el claim `user_role` (nombre exacto
  de `06-AUTH-ROLES.md`) al objeto `claims`, `null` si no hay perfil.
  `execute` otorgado solo a `supabase_auth_admin`, revocado
  explícitamente de `authenticated`/`anon`/`public`. Verificado con
  `execute_sql`: usuario de prueba con `role = 'seller'`, evento de
  ejemplo (`user_id`, `claims` con `sub`/`aud`) → la función devuelve
  `claims.user_role = "seller"`. Sin excepción, cleanup confirmado
  (`0` residuos).
- **Archivos:**
  `packages/db/migrations/20260808141500_custom_access_token_hook.sql`.
- **Resultado:** verificación OK. Función lista, pero **inactiva**
  hasta el paso 7.2 (punto de control manual — el usuario debe
  habilitarla en Supabase Dashboard). Sin eso, el middleware de la
  Fase 9 no puede leer el rol del JWT.
- **Commit:** `feat(db): función custom_access_token_hook (claim user_role)`

---

### 2026-08-08 — paso 7.2 (Auth Hook habilitado, punto de control manual)

- **Hecho:** el usuario habilitó el hook "Customize Access Token (JWT)
  Claims" en Supabase Dashboard → Authentication → Hooks, tipo
  Postgres, schema `public`, función `custom_access_token_hook`
  (confirmado con captura: `ENABLED`). Intenté verificación end-to-end
  (crear usuario de prueba, login real vía `/auth/v1/token`, decodificar
  el JWT y confirmar el claim `user_role`) pero la política de red de
  este entorno bloquea `supabase.co` para llamadas HTTP directas (solo
  el canal MCP de Supabase llega, no `curl`/`WebFetch`) — confirmado
  vía `$HTTPS_PROXY/__agentproxy/status`. No es una limitación del
  hook ni de la función, es del sandbox donde corro. Se limpió el
  usuario de prueba creado para el intento (`0` residuos confirmado).
  La función `custom_access_token_hook` ya se probó a nivel SQL en el
  paso 7.1 (evento de ejemplo → claim correcto) — el hook ahora está
  activo y Supabase Auth la invocará en cada emisión de JWT. La
  confirmación end-to-end real (login de un usuario real, JWT
  decodificado en el navegador) queda para el primer login real de la
  Fase 8, cuando exista `/login`.
- **Archivos:** ninguno (configuración vive en Supabase, no en el
  repo).
- **Resultado:** hook activo, verificado por diseño (7.1) y por
  configuración (captura del usuario). Verificación end-to-end
  diferida a Fase 8 por limitación de red del entorno, no por duda
  sobre la función. Fase 7 cerrada.
- **Commit:** N/A (sin cambios de archivo, configuración externa)

### 2026-08-08 — paso 8.1 (/registro: primer código de frontend real)

- **Hecho:** primer paso de UI real de todo el proyecto. Bloqueante
  descubierto antes de codear: `05-RLS-SECURITY.md` sección 8 exige
  guardar fecha/IP/versión de política del consentimiento, pero
  ningún doc de esquema tenía dónde — corregido en el mismo paso
  (migración `profiles_data_consent`, `04-DATABASE-SCHEMA-A.md`
  actualizado, decisión en `DECISIONS.md`).
  Arquitectura: `packages/core/src/companies/register-user.ts`
  (`registerUser`) — lógica de negocio pura, recibe los clientes
  Supabase y el contexto por parámetro, nunca lee sesión por su
  cuenta (regla de `01-ARCHITECTURE.md`). Hace `signUp` con el
  cliente bound a cookies (crea la sesión), luego usa un cliente
  `service_role` para: guardar el consentimiento en `profiles`,
  buscar la empresa por NIT, crear la empresa si no existe
  (`companies` no tiene política de insert — intencional, el master
  es dueño del contenido) o unir al usuario como `buyer` si ya
  existe. Nuevo `createServiceRoleClient` en `packages/db/src/client.ts`
  (sin cookies, bypassa RLS, server-only). Schema Zod
  `registerSchema` en `packages/shared` (`DATA_POLICY_VERSION`
  centralizada). Server Action `registerAction` en
  `apps/web/app/(auth)/registro/actions.ts` valida con Zod, arma los
  clientes con `env.ts`, saca la IP de `x-forwarded-for`, redirige a
  `/verificar` en éxito o a `/registro?error=...` en falla (sin JS de
  cliente — `<form action={...}>` nativo, regla de
  `CLAUDE.md` sección 7). Página `page.tsx`: Server Component, tokens
  de `02-DESIGN-SYSTEM.md` vía clases Tailwind existentes.
- **Verificación:** `pnpm typecheck` y `pnpm lint` en la raíz, verdes
  en los 7 paquetes. `pnpm build` local falla por el mismo problema de
  red del sandbox al pedir Google Fonts (visto en 5.2, no relacionado
  con este código) — se confirma con el "Build" de CI, que sí llega a
  internet real. `/verificar` y `/login` (destinos de los links y del
  redirect) todavía no existen — 404 esperado hasta los pasos 8.2/8.3.
- **Archivos:**
  `packages/db/migrations/20260808150000_profiles_data_consent.sql`,
  `docs/04-DATABASE-SCHEMA-A.md`, `docs/progress/DECISIONS.md`,
  `packages/core/package.json`,
  `packages/core/src/companies/register-user.ts`,
  `packages/core/src/index.ts`,
  `packages/shared/src/schemas/register.ts`, `packages/shared/src/index.ts`,
  `packages/db/src/client.ts`, `packages/db/src/index.ts`,
  `apps/web/package.json`, `apps/web/app/(auth)/registro/actions.ts`,
  `apps/web/app/(auth)/registro/page.tsx`, `pnpm-lock.yaml`.
- **Resultado:** verificación local OK (typecheck/lint). Pendiente
  confirmar el build real en CI con el próximo push.
- **Commit:** `feat(web): página /registro con Server Action y consentimiento de datos`

## Bloqueos

- **Resend/dominio:** fuera de esta tarea por decisión del usuario
  (2026-08-08). No bloquea el resto — Supabase Auth cubre el envío de
  correo necesario para Fase 1.
- ~~Auth Hook (paso 7.2)~~ — **resuelto 2026-08-08.** Habilitado en
  Supabase Dashboard. Middleware (Fase 9) ya puede leer `user_role`
  del JWT.
- ~~Verificación verde/rojo de `rls-tests` (paso 4.2)~~ — **resuelto
  2026-08-08.** Verde real confirmado vía API de GitHub Actions.

## Pendientes descubiertos

- 2FA (TOTP) para `seller`/`technician`/`master`: el roadmap lo pide en
  Fase 1, pero no hay UI de `(staff)` para configurarlo. Se implementa
  cuando existan esos paneles.
- `docs/10-INTEGRATION-RESEND.md` sigue sin escribirse — se escribe cuando
  exista dominio y se integre Resend de verdad.
- ~~`SUPABASE_SERVICE_ROLE_KEY` faltante como GitHub Secret~~ —
  **resuelto 2026-08-08.** Cargada en Vercel y como Repository Secret en
  GitHub; `rls-tests` verificado en verde en ambos.
