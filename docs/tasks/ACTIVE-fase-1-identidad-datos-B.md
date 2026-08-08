# TAREA: Fase 1 — Identidad y datos (parte B: bitácora, bloqueos, pendientes)

Parte A (objetivo, decisiones, plan completo): [`ACTIVE-fase-1-identidad-datos-A.md`](./ACTIVE-fase-1-identidad-datos-A.md)

## Bitácora

### 2026-08-08 — paso 1.1 (docs/18-TESTING.md)

- **Hecho:** escrito `docs/18-TESTING.md` — niveles de prueba (unit en
  `packages/core`, integración de RLS, E2E diferido a Fase 2), patrón de
  5 pasos para pruebas de aislamiento (arrange con `service_role`,
  assert siempre con JWT real de usuario, cleanup obligatorio dado que
  el proyecto Supabase es único), qué corre en CI y bloquea el merge, y
  qué queda fuera todavía (carga, accesibilidad automatizada,
  integraciones externas reales).
- **Archivos:** `docs/18-TESTING.md` (nuevo), `docs/00-INDEX.md`
  (estado 18 → ✅).
- **Resultado:** verificación OK. 95 líneas, bajo el límite de 500.
- **Commit:** `docs(testing): agrega 18-TESTING.md`

### 2026-08-08 — paso 2.1 (migración profiles)

- **Hecho:** aplicada la migración `create_profiles` vía
  `mcp__Supabase__apply_migration` sobre el proyecto `tecni`
  (`sieiprqcvubkmrmvwwik`): `create type user_role`, tabla `profiles`
  exacta a `04-DATABASE-SCHEMA-A.md` sección 3 (FK a `auth.users(id)`,
  `on delete cascade`), `alter table profiles enable row level
  security;` en la misma migración. Sin políticas todavía.
- **Corrección en vivo:** al aplicar la migración noté que no quedaba
  versionada en el repo (solo en Supabase). `CLAUDE.md` sección 7 ya
  define convención de nombres de migración
  (`YYYYMMDDHHMMSS_descripcion_corta.sql`), lo que implica que deben
  vivir como archivo. Se creó `packages/db/migrations/` y se guardó el
  SQL aplicado; se actualiza el comentario de `packages/db/src/index.ts`
  (ya no dice "sin migraciones"). Este patrón se repite en cada paso de
  migración de aquí en adelante.
- **Archivos:** `packages/db/migrations/20260808114500_create_profiles.sql`,
  `packages/db/src/index.ts`.
- **Resultado:** verificación OK, por mecanismo, no por tabla vacía:
  `pg_class.relrowsecurity = true` y `pg_policies` con `policy_count =
  0` para `profiles` — Postgres garantiza bloqueo total con RLS
  habilitada y cero políticas, independientemente de si hay datos.
  `list_tables` confirma columnas, tipos y FK exactos al esquema
  documentado.
- **Commit:** `feat(db): migración profiles con RLS bloqueada`

### 2026-08-08 — paso 2.2 (migración companies + company_members)

- **Hecho:** aplicada `create_companies_and_members` vía
  `apply_migration`: `create type company_member_role`, tablas
  `companies` y `company_members` exactas a
  `04-DATABASE-SCHEMA-A.md` sección 3 (índices en `assigned_seller_id`
  y `profile_id`), RLS habilitada en ambas, sin políticas.
- **Archivos:**
  `packages/db/migrations/20260808120000_create_companies_and_members.sql`.
- **Resultado:** verificación OK, mismo mecanismo que 2.1:
  `pg_class.relrowsecurity = true` en ambas tablas, `pg_policies`
  devuelve 0 filas para las dos.
- **Commit:** `feat(db): migración companies y company_members con RLS bloqueada`

### 2026-08-08 — paso 2.3 (migración settings + seed)

- **Hecho:** aplicada `create_settings` vía `apply_migration`: tabla
  `settings` exacta a `04-DATABASE-SCHEMA-B.md` sección 7, RLS
  habilitada **sin ninguna política** (decisión de esta tarea, ver
  Decisiones), seed `quote_threshold_cop = 5000000` insertado en la
  misma migración.
- **Archivos:** `packages/db/migrations/20260808121500_create_settings.sql`.
- **Resultado:** verificación OK. `relrowsecurity = true`,
  `policy_count = 0` (bloqueada incluso para `master`, como se decidió).
  El seed existe y es legible vía `service_role`
  (`quote_threshold_cop: 5000000`) — confirma que la tabla funciona,
  solo está cerrada a clientes.
- **Commit:** `feat(db): migración settings bloqueada por completo con seed`

### 2026-08-08 — paso 2.4 (migración audit_log)

- **Hecho:** aplicada `create_audit_log` vía `apply_migration`: tabla
  exacta a `04-DATABASE-SCHEMA-B.md` sección 7 (índices en
  `(entity, entity_id)` y `(actor_id, created_at desc)`), RLS habilitada,
  sin políticas todavía (la de `master` llega en 3.4).
- **Archivos:** `packages/db/migrations/20260808122500_create_audit_log.sql`.
- **Resultado:** verificación OK. `relrowsecurity = true`,
  `policy_count = 0`.
- **Commit:** `feat(db): migración audit_log con RLS bloqueada`

### 2026-08-08 — paso 2.5 (funciones auxiliares RLS)

- **Hecho:** aplicada `create_rls_helper_functions` vía `apply_migration`:
  `auth_role()`, `auth_company_ids()`, `is_master()` exactas a
  `04-DATABASE-SCHEMA-B.md` sección 8. `auth_role()` y
  `auth_company_ids()` son `security definer` — evita recursión infinita
  cuando `auth_company_ids()` se use dentro de la política de
  `company_members` en la Fase 3.
- **Archivos:**
  `packages/db/migrations/20260808123500_create_rls_helper_functions.sql`.
- **Resultado:** verificación OK. `select auth_role(), is_master(),
  (select count(*) from auth_company_ids());` ejecuta sin error →
  `{"role":null,"is_master":null,"company_count":0}`. Correcto: sin
  sesión (`auth.uid()` nulo), lógica de tres valores de SQL da `null`,
  equivalente a `false` dentro de un `USING`.
- **Commit:** `feat(db): funciones auxiliares auth_role, auth_company_ids, is_master`

### 2026-08-08 — paso 2.6 (get_advisors de seguridad)

- **Hecho:** corrido `mcp__Supabase__get_advisors` (tipo `security`).
  Resultado inicial: 5 INFO `rls_enabled_no_policy` (una por tabla —
  esperado, se cierra en Fase 3) + 3 WARN: `is_master()` con
  `search_path` mutable, y `auth_role()`/`auth_company_ids()`
  ejecutables como RPC público (`/rest/v1/rpc/...`) por `anon` y
  `authenticated`. Los WARN no estaban justificados por escrito → se
  corrigieron en el mismo paso (patrón de la corrección en vivo del
  paso 2.1): migración `harden_rls_helper_functions` fija
  `search_path = public` en `is_master()`, revoca `execute` de `public`
  y `anon` sobre `auth_role()`/`auth_company_ids()` (no las necesitan,
  sin sesión no participan de ninguna política), mantiene `execute`
  para `authenticated` (imprescindible: las políticas RLS de Fase 3 las
  invocan como ese rol dentro de `USING`, revocarlo rompería el propio
  RLS). Se re-corrió `get_advisors`: quedan solo los 5 INFO esperados y
  un WARN justificado (`authenticated` ejecuta `auth_company_ids()` /
  `auth_role()` vía RPC directo — aceptado, la función solo expone
  datos del propio usuario autenticado, sin fuga entre empresas).
- **Archivos:**
  `packages/db/migrations/20260808124500_harden_rls_helper_functions.sql`.
- **Resultado:** verificación OK. Cero advertencias de seguridad sin
  justificar. Fase 2 cerrada.
- **Commit:** `fix(db): endurece permisos de funciones auxiliares RLS`

### 2026-08-08 — paso 3.1 (políticas RLS de profiles)

- **Hecho:** aplicadas `profiles_self` y `profiles_update_self` vía
  `apply_migration`, exactas a `05-RLS-SECURITY.md` sección 4. Prueba de
  aislamiento real con `execute_sql`: creados 3 usuarios de prueba en
  `auth.users` + `profiles` (A `customer`, B `customer`, M `master`) en
  un bloque `do $$ ... $$` que cambia a rol `authenticated` (`set local
  role`) e inyecta `request.jwt.claims` por usuario (simula JWT real).
  Asserts (con `raise exception` si fallan, cero excepción = todo
  pasó): (1) A ve exactamente 1 fila (la suya); (2) A no ve la fila de
  B; (3) A no puede auto-promoverse a `master` (`update ... set role =
  'master'` falla, capturado); (4) M ve las 3 filas (`is_master()` en
  la política). El bloque terminó sin lanzar ninguna excepción → los 4
  asserts pasaron. Cleanup en el mismo bloque (`delete` de `profiles` y
  `auth.users` de prueba) — confirmado con `select count(*) from
  profiles where full_name like 'RLS Test%'` → `0`.
- **Archivos:**
  `packages/db/migrations/20260808130000_profiles_rls_policies.sql`.
- **Resultado:** verificación OK. Sin basura de prueba en la base.
- **Commit:** `feat(db): políticas RLS de profiles con prueba de aislamiento`

### 2026-08-08 — paso 3.2 (políticas RLS de companies)

- **Hecho:** aplicadas `companies_read` y `companies_update_own`, exactas
  a `05-RLS-SECURITY.md` sección 4. Prueba de aislamiento con dos
  empresas (X, Y) y 5 usuarios de prueba (owner de X, buyer de X,
  vendedor asignado a Y, un outsider sin relación, un master). Primer
  intento reveló que `companies_update_own` no deja actualizar a nadie
  todavía — su subconsulta lee `company_members`, que sigue con RLS
  bloqueada sin políticas (llega en 3.3). No es un bug de esta
  migración: es exactamente el comportamiento esperado dado el orden
  del plan. Se documentó en el propio archivo de migración y se ajustó
  la prueba: se retiró el assert de "owner actualiza con éxito" (queda
  pendiente re-verificar tras 3.3), se mantuvo el de "buyer no puede
  actualizar" (0 filas afectadas, sigue siendo cierto sea cual sea el
  estado de `company_members`).
  Asserts que pasaron (sin excepción = todos ok): (1) owner_x ve solo
  empresa X; (2) owner_x no ve empresa Y; (3) seller_y ve empresa Y por
  `assigned_seller_id`; (4) seller_y no tiene otra vía de acceso más
  que esa; (5) outsider no ve ninguna empresa; (6) buyer_x no puede
  actualizar empresa X (0 filas); (7) master ve ambas empresas.
  El primer intento (con el assert de update que sí falló) abortó toda
  la transacción automáticamente — confirmado `select count(*) ...` →
  `0` antes de reintentar, no dejó residuos.
- **Archivos:**
  `packages/db/migrations/20260808131500_companies_rls_policies.sql`.
- **Resultado:** verificación OK. Sin basura de prueba. Pendiente:
  reconfirmar `companies_update_own` con owner real tras 3.3.
- **Commit:** `feat(db): políticas RLS de companies con prueba de aislamiento`

### 2026-08-08 — paso 3.3 (política RLS de company_members)

- **Hecho:** aplicada `members_read`, exacta a `05-RLS-SECURITY.md`
  sección 4 — usa `auth_company_ids()` (security definer), no una
  subconsulta directa sobre la propia tabla (recursión infinita).
  Prueba con 2 empresas, 5 usuarios: owner_x ve exactamente sus 2
  membresías (la propia + la de buyer_x, misma empresa), no ve la de
  owner_y; outsider no ve ninguna; master ve las 3. Además se
  **reverificó el pendiente del paso 3.2**: con `company_members` ya
  legible, `companies_update_own` ahora sí deja a owner_x actualizar su
  empresa (antes 0 filas, ahora 1), y buyer_x sigue sin poder (0 filas)
  — confirma que la dependencia entre 3.2 y 3.3 quedó resuelta como se
  esperaba, sin tocar la migración de 3.2.
- **Archivos:**
  `packages/db/migrations/20260808132500_company_members_rls_policy.sql`.
- **Resultado:** verificación OK, incluida la reverificación de 3.2.
  Sin residuos de prueba.
- **Commit:** `feat(db): política RLS de company_members, cierra dependencia con companies_update_own`

### 2026-08-08 — paso 3.4 (política RLS de audit_log)

- **Hecho:** aplicada `audit_read_master`, exacta a
  `05-RLS-SECURITY.md` sección 4 — solo `select` para `master`, sin
  política de insert/update/delete (inmutable, solo `service_role`
  escribe). Prueba con un usuario `customer` y uno `master`. Dos
  intentos previos de la prueba tuvieron bugs propios (no de la
  migración): asumí que un `update`/`delete` sin política lanza error —
  en Postgres afecta 0 filas silenciosamente (el `using` filtra antes,
  sin excepción); y que un `insert` sin política también afecta 0
  filas — en realidad **sí** lanza `insufficient_privilege` (`new row
  violates row-level security policy`), porque el `with check` por
  defecto es `false` y el error es explícito. Corregido el patrón de
  aserción para cada tipo de operación. Con eso: (1) customer no ve la
  fila de prueba; (2) customer no puede insertar (RLS lo rechaza con
  error); (3) master sí ve la fila; (4) master no puede actualizarla (0
  filas); (5) master no puede borrarla (0 filas) — inmutable incluso
  para el rol más alto.
- **Archivos:**
  `packages/db/migrations/20260808133500_audit_log_rls_policy.sql`.
- **Resultado:** verificación OK. Sin residuos de prueba (los dos
  intentos fallidos por bug de la prueba abortaron su transacción
  entera, confirmado con `select count(*) ...` → `0`).
- **Commit:** `feat(db): política RLS de audit_log (solo lectura master, inmutable)`

### 2026-08-08 — paso 3.5 (get_advisors de cierre de Fase 3)

- **Hecho:** corrido `get_advisors` (tipo `security`) tras abrir todas
  las políticas de `profiles`, `companies`, `company_members` y
  `audit_log`. Resultado: 1 INFO (`rls_enabled_no_policy` en
  `settings` — esperado, decisión de esta tarea, se abre en Fase 5) +
  los mismos 2 WARN ya justificados por escrito en el paso 2.6
  (`authenticated` puede invocar `auth_role()`/`auth_company_ids()` vía
  RPC directo, imprescindible porque las políticas recién creadas los
  usan dentro de `USING`). Nada nuevo sin justificar.
- **Archivos:** ninguno (paso de solo lectura).
- **Resultado:** verificación OK. Fase 3 cerrada — las cuatro tablas de
  identidad tienen su política mínima activa y probada.
- **Commit:** N/A (sin cambios de archivo, solo bitácora)

### 2026-08-08 — paso 4.1 (script de pruebas de aislamiento)

- **Hecho:** añadido `vitest` + `@supabase/supabase-js` a `@tecni/db`.
  Escrito `packages/db/tests/rls/helpers.ts` (clientes `adminClient`
  con `service_role`, `anonClient`, `createTestUser`/`deleteTestUser`
  vía `auth.admin`, `signInAs` con `signInWithPassword` real — JWT
  genuino, no simulado) y dos suites siguiendo el patrón de
  `18-TESTING.md` sección 2: `tests/rls/companies.test.ts` (miembro ve
  solo su empresa, usuario sin empresa no ve nada, `anon` no ve nada) y
  `tests/rls/company_members.test.ts` (miembro ve su membresía y las de
  su empresa, no las de otra; `anon` no ve nada). `tsconfig.json`
  ampliado para incluir `tests/`, `types: ["node"]`;
  `pnpm-workspace.yaml` con `onlyBuiltDependencies: [esbuild]`
  (necesario para que `vitest` instale sin prompt interactivo).
- **Bloqueo real y cómo se resolvió:** correr el script de verdad
  requiere `SUPABASE_SERVICE_ROLE_KEY` (`auth.admin.createUser` es un
  endpoint admin de GoTrue, exige esa key específicamente — la `anon`
  key no sirve ni para esto ni bypasseando RLS). El usuario cargó la
  key en Vercel (marcada sensible, no visible ni siquiera para él en
  la UI). Este entorno no tiene el CLI de `vercel` instalado ni sesión
  iniciada, así que `vercel env pull` no es viable aquí, y las
  herramientas MCP de Supabase deliberadamente no exponen
  `service_role` (solo `get_publishable_keys`, que da la `anon`).
  Corrida local con la `anon` key confirmó el fallo esperado y limpio:
  `admin.createUser` rechaza sin `service_role` real (mensaje de
  GoTrue, no una excepción no controlada), y el `afterAll` no dejó
  residuos (`select count(*) from auth.users where email like
  'rls-%@tecni.test'` → `0`; mismo con `companies`). Verificación real
  en verde/rojo queda para el paso 4.2, cuando el secreto viva en
  GitHub Actions y el script corra en CI end-to-end.
  - **Sí se verificó localmente, sin la key:** `pnpm --filter @tecni/db
    typecheck` y `pnpm --filter @tecni/db lint` pasan; `pnpm typecheck`
    y `pnpm lint` en la raíz pasan sin romper nada del resto del
    monorepo.
- **Archivos:** `packages/db/package.json`, `packages/db/tsconfig.json`,
  `packages/db/vitest.config.ts`, `packages/db/tests/rls/helpers.ts`,
  `packages/db/tests/rls/companies.test.ts`,
  `packages/db/tests/rls/company_members.test.ts`,
  `pnpm-workspace.yaml`, `pnpm-lock.yaml`.
- **Resultado:** script listo y tipado, sin verificación verde/rojo
  real todavía (bloqueado por falta de acceso a `service_role` en este
  entorno, no por diseño del script). Se cierra en 4.2.
- **Commit:** `feat(db): script de pruebas de aislamiento RLS (companies, company_members)`

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
- **Resultado:** pendiente de confirmar verde tras el próximo push.
- **Commit:** `fix(build): declara SUPABASE_SERVICE_ROLE_KEY en turbo.json`

---

## Bloqueos

- **Resend/dominio:** fuera de esta tarea por decisión del usuario
  (2026-08-08). No bloquea el resto — Supabase Auth cubre el envío de
  correo necesario para Fase 1.
- **Auth Hook (paso 7.2):** requiere una acción manual del usuario en el
  Dashboard de Supabase. Bloquea el middleware (Fase 9) hasta que se haga.
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
