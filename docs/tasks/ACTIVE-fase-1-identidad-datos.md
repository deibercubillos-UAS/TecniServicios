# TAREA: Fase 1 — Identidad y datos

**Estado:** En curso · **Riesgo:** Riesgoso
**Inicio:** 2026-08-08 · **Última actualización:** 2026-08-08

## Objetivo

Que un usuario pueda registrarse, verificar su correo, iniciar sesión y que su
empresa exista — con RLS real, probada, en las tablas de identidad
(`profiles`, `companies`, `company_members`, `settings`, `audit_log`).
Middleware protegiendo rutas por rol. Es la fase más importante del roadmap:
un error aquí se propaga a todo lo demás.

**No entra en esta tarea:**
- Catálogo, comercio, postventa, contenido (tablas de `04-DATABASE-SCHEMA-B.md`
  secciones 5–7) — Fases 2–5.
- Integración con Resend ni dominio verificado — **bloqueado, sin dominio de
  producción**. Verificación de correo y recuperación de contraseña usan el
  envío integrado de Supabase Auth (no Resend). Decisión del usuario
  2026-08-08.
- 2FA (TOTP) para `seller`/`technician`/`master` — el roadmap lo pide en
  Fase 1, pero no hay UI de esos paneles todavía para configurarlo; se monta
  cuando exista `(staff)`. Anotado como pendiente descubierto.
- Panel para editar `settings` desde la UI — es Fase 5. Hoy la tabla queda
  bloqueada por completo (sin políticas RLS), solo `service_role` la toca.

## Documentos consultados

- `CLAUDE.md` — regla de oro 2 (RLS obligatoria), 8 (audit_log).
- `docs/04-DATABASE-SCHEMA-A.md` — convenciones, enums, tablas de identidad
  (`profiles`, `companies`, `company_members`).
- `docs/04-DATABASE-SCHEMA-B.md` sección 7 y 8 — `settings`, `audit_log`,
  funciones auxiliares (`auth_role`, `auth_company_ids`, `is_master`).
- `docs/05-RLS-SECURITY.md` — políticas exactas por tabla, checklist
  obligatorio, metodología de pruebas de aislamiento.
- `docs/06-AUTH-ROLES.md` — flujo de registro/verificación, `ROUTE_RULES`
  del middleware, cambio de rol, 2FA.
- `docs/21-ROADMAP.md` — definición de "listo" de la Fase 1.
- `docs/23-TASK-EXECUTION.md` — granularidad para tareas riesgosas.
- `docs/progress/TODO.md`, `docs/progress/DECISIONS.md` — confirmado: un
  solo proyecto Supabase (`tecni`, `sa-east-1`), sin separación staging/prod
  (riesgo ya registrado 2026-08-08).

## Decisiones tomadas durante la ejecución

- 2026-08-08: Resend queda fuera de esta tarea por falta de dominio. La
  verificación de correo y recuperación de contraseña usan el proveedor de
  correo integrado de Supabase Auth (gratuito, limitado en volumen, sin
  necesidad de dominio propio). Cuando exista dominio, se integra Resend
  según `docs/10-INTEGRATION-RESEND.md` (pendiente de escribir en ese
  momento).
- 2026-08-08: `settings` queda con RLS habilitada y **sin ninguna política**
  — bloqueada incluso para `master`. Solo `service_role` la lee/escribe,
  siempre desde `packages/core`. Se agrega política de lectura para
  `master` en la Fase 5, cuando exista el panel para editarla.
- 2026-08-08: como hay un solo proyecto Supabase (sin `staging`), las
  pruebas de aislamiento de la Fase 4 de este plan corren contra el
  proyecto real `tecni`. Cada prueba limpia sus propios datos al final
  (rollback o `delete` explícito) — no debe quedar basura de prueba en la
  base de datos que algún día tendrá clientes reales.

---

## Plan

### Fase 1 — Documentación previa (regla 9 de `CLAUDE.md`)

- [x] **1.1** Escribir `docs/18-TESTING.md`: qué se prueba y cómo (unit en
  `packages/core`, integración de RLS con dos empresas y dos usuarios,
  qué corre en CI y bloquea el merge). Actualizar `docs/00-INDEX.md`
  (estado ✅).
  - Verificación: el archivo existe, sigue la referencia de
    `05-RLS-SECURITY.md` sección 10, no supera 500 líneas.
  - Reversión: eliminar el archivo, revertir `00-INDEX.md`.

### Fase 2 — Esquema de identidad, RLS bloqueada desde el primer commit

Cada migración crea la tabla **y** `enable row level security` en el mismo
paso, sin políticas todavía (bloqueo total intencional, ver ejemplo de
`23-TASK-EXECUTION.md` sección 7).

- [x] **2.1** Migración `profiles`: `create type user_role`, tabla
  `profiles` completa (columnas de `04-DATABASE-SCHEMA-A.md` sección 3),
  RLS habilitada, sin políticas.
  - Verificación: `mcp__Supabase__apply_migration` aplica sin error;
    `execute_sql` como rol `authenticated` de prueba sobre `profiles`
    devuelve 0 filas (bloqueo confirmado) aunque haya datos.
  - Reversión: migración inversa `drop table profiles cascade; drop type
    user_role;`.
- [ ] **2.2** Migración `companies` + `company_members`: `create type
  company_member_role`, ambas tablas, índices, RLS habilitada en las dos,
  sin políticas.
  - Verificación: igual patrón — `execute_sql` de prueba confirma bloqueo
    total en ambas tablas.
  - Reversión: `drop table company_members, companies cascade; drop type
    company_member_role;`.
- [ ] **2.3** Migración `settings`: tabla completa, RLS habilitada, **sin
  política ninguna** (decisión de esta tarea), seed de
  `quote_threshold_cop` = `5000000` insertado en la misma migración
  (como `service_role`, vía SQL directo, no vía política).
  - Verificación: `execute_sql` como `authenticated` de prueba sobre
    `settings` devuelve 0 filas; como `service_role` sí ve el seed.
  - Reversión: `drop table settings;`.
- [ ] **2.4** Migración `audit_log`: tabla completa, índices, RLS
  habilitada, sin políticas todavía (se agrega la de `master` en la
  Fase 3).
  - Verificación: `execute_sql` de prueba confirma bloqueo total.
  - Reversión: `drop table audit_log;`.
- [ ] **2.5** Migración de funciones auxiliares: `auth_role()`,
  `auth_company_ids()`, `is_master()` exactamente como
  `04-DATABASE-SCHEMA-B.md` sección 8.
  - Verificación: `select auth_role(), is_master();` ejecuta sin error
    (devuelve `null`/`false` sin sesión, como se espera).
  - Reversión: `drop function auth_role(), auth_company_ids(), is_master();`.
- [ ] **2.6** `mcp__Supabase__get_advisors` (tipo `security`) sobre el
  proyecto — revisar que no haya advertencias nuevas introducidas por
  estas migraciones antes de seguir.
  - Verificación: cero advertencias de seguridad nuevas, o justificadas
    por escrito si alguna es esperada en este punto (RLS sin políticas
    puede generar un aviso informativo, no un error).
  - Reversión: N/A (paso de solo lectura).

### Fase 3 — Políticas RLS (se abre permiso por permiso, nunca al revés)

- [ ] **3.1** Políticas de `profiles`: `profiles_self`,
  `profiles_update_self` (con el `check` que impide auto-promoción de
  rol), exactas de `05-RLS-SECURITY.md` sección 4.
  - Verificación: con dos usuarios de prueba A y B, A lee su propio
    perfil y **no** el de B; A no puede cambiarse `role` a `master` vía
    `update`.
  - Reversión: `drop policy profiles_self, profiles_update_self on profiles;`.
- [ ] **3.2** Políticas de `companies`: `companies_read`,
  `companies_update_own`.
  - Verificación: usuario de la empresa X lee X, no lee Y; `assigned_seller_id`
    también puede leer.
  - Reversión: `drop policy` de ambas.
- [ ] **3.3** Política de `company_members`: `members_read`, usando
  `auth_company_ids()` (nunca una subconsulta directa — recursión
  infinita, advertencia explícita del doc).
  - Verificación: usuario ve sus propias membresías y las de su empresa,
    no las de otra.
  - Reversión: `drop policy members_read on company_members;`.
- [ ] **3.4** Política de `audit_log`: `audit_read_master` únicamente
  (sin insert/update/delete — inmutable, solo `service_role` escribe).
  - Verificación: usuario `master` de prueba lee `audit_log`; usuario
    `customer` de prueba no lee nada.
  - Reversión: `drop policy audit_read_master on audit_log;`.
- [ ] **3.5** `get_advisors` (tipo `security`) de nuevo, ahora con
  políticas activas — confirmar que no quedó ninguna tabla con RLS
  habilitada sin al menos una política de lectura pensada.
  - Verificación: sin advertencias nuevas no justificadas.
  - Reversión: N/A.

### Fase 4 — Pruebas de aislamiento

- [ ] **4.1** Script de prueba de integración (Node, `@supabase/supabase-js`
  con `service_role` para preparar datos, clientes con JWT de prueba para
  verificar): crea dos empresas, un usuario por empresa; verifica que el
  usuario A no lee ni una fila de la empresa B en `companies`,
  `company_members`; verifica que un cliente `anon` no lee nada de
  ninguna tabla de identidad. **Limpia sus datos al final** (mismo
  proyecto que usará datos reales).
  - Verificación: el script falla (rojo) si se comenta temporalmente una
    política, y pasa (verde) con las políticas activas — prueba que la
    prueba prueba algo.
  - Reversión: eliminar el script; no deja estado en la base si limpia
    bien.
- [ ] **4.2** Integrar el script como paso de CI (nuevo job `rls-tests` en
  `.github/workflows/ci.yml`), usando `SUPABASE_SERVICE_ROLE_KEY` y
  `NEXT_PUBLIC_SUPABASE_URL` como GitHub Secrets (el usuario debe
  cargarlos en Settings → Secrets and variables → Actions; yo no puedo
  cargarlos ahí).
  - Verificación: el job corre en un push de prueba y pasa en verde en
    GitHub Actions (confirmado vía API, no solo local).
  - Reversión: quitar el job del workflow.

### Fase 5 — Cliente Supabase y `env.ts` conectado

- [ ] **5.1** Instalar `@supabase/supabase-js` y `@supabase/ssr`; crear
  `packages/db/src/client.ts` con helpers `createServerClient` (cookies
  de Next) y `createBrowserClient`.
  - Verificación: `pnpm --filter @tecni/db typecheck` pasa.
  - Reversión: eliminar el archivo y las dependencias.
- [ ] **5.2** Conectar `packages/shared/env.ts` a `apps/web` por primera
  vez (ya existen `NEXT_PUBLIC_SUPABASE_URL`/`ANON_KEY` en Vercel).
  `SUPABASE_SERVICE_ROLE_KEY` sigue faltando en Vercel — verificar con el
  usuario antes de este paso si ya la cargó, si no, el build de
  producción fallará a propósito (comportamiento correcto de `env.ts`,
  pero hay que coordinarlo para no romper el deploy sin aviso).
  - Verificación: `pnpm --filter web build` pasa localmente con las
    variables de prueba; se coordina con el usuario antes de que este
    commit llegue a Vercel.
  - Reversión: revertir el import de `env.ts` en `apps/web`.

### Fase 6 — Trigger de creación de perfil

- [ ] **6.1** Función + trigger Postgres `handle_new_user`: al insertar en
  `auth.users`, crea la fila correspondiente en `profiles`
  (`full_name` desde `raw_user_meta_data`, `role` default `'customer'`).
  - Verificación: `execute_sql` — insertar un usuario de prueba en
    `auth.users` (o registrar uno real de prueba) y confirmar que
    aparece en `profiles` automáticamente.
  - Reversión: `drop trigger`, `drop function handle_new_user`.

### Fase 7 — Rol en el JWT (Auth Hook)

- [ ] **7.1** Función Postgres `custom_access_token_hook` que agrega el
  claim `user_role` al JWT desde `profiles.role`.
  - Verificación: `execute_sql` prueba la función con un `event` de
    ejemplo, confirma que devuelve el claim esperado.
  - Reversión: `drop function custom_access_token_hook`.
- [ ] **7.2** **Punto de control manual.** Pedir al usuario que habilite
  el hook en Supabase Dashboard → Authentication → Hooks → Custom Access
  Token (no hay herramienta MCP para esto). Sin este paso manual, el
  middleware de la Fase 9 no puede leer el rol del JWT.
  - Verificación: un login de prueba después de habilitarlo trae el
    claim `user_role` en el JWT decodificado.
  - Reversión: deshabilitar el hook en el dashboard.

### Fase 8 — Páginas de autenticación

- [ ] **8.1** `/registro`: Server Action con `signUp`, casilla de
  autorización de tratamiento de datos (fecha, IP, versión de política —
  `05-RLS-SECURITY.md` sección 8), lógica de NIT existente (→
  `company_member` `buyer` pendiente) vs. nuevo (→ `company` +
  `company_member` `owner`), validación Zod de toda la entrada.
  - Verificación: registro real de prueba crea `profiles` +
    `companies`/`company_members` correctos según si el NIT existe o no.
  - Reversión: revertir el commit de la página/Server Action.
- [ ] **8.2** `/login`: Server Action con `signInWithPassword`, mensaje
  genérico de error (no revela si el correo existe).
  - Verificación: login real de prueba funciona; credenciales inválidas
    dan el mismo mensaje que un correo inexistente.
  - Reversión: revertir el commit.
- [ ] **8.3** `/verificar`: pantalla de estado post-registro (correo
  enviado, pendiente de verificar), usando el flujo nativo de Supabase
  Auth.
  - Verificación: el enlace de verificación que llega al correo de
    prueba marca la cuenta como verificada.
  - Reversión: revertir el commit.
- [ ] **8.4** `/recuperar`: solicitud y confirmación de recuperación de
  contraseña, vía Supabase Auth.
  - Verificación: flujo completo de prueba cambia la contraseña.
  - Reversión: revertir el commit.

### Fase 9 — Middleware de rutas

- [ ] **9.1** `apps/web/middleware.ts` con `ROUTE_RULES` exacto de
  `06-AUTH-ROLES.md` sección 5. Lee el rol desde el JWT (claim de la
  Fase 7), nunca consulta la base de datos. Sin sesión → `/login?next=`;
  rol insuficiente → `/403` (nunca redirección al dashboard de otro
  rol); correo sin verificar → `/verificar`.
  - Verificación: pruebas manuales con los tres casos (sin sesión, rol
    insuficiente, correo sin verificar) para al menos una ruta protegida
    real.
  - Reversión: eliminar `middleware.ts`.

### Fase 10 — Cierre

- [ ] **10.1** Checklist de seguridad de `05-RLS-SECURITY.md` sección 9,
  respondido explícitamente para cada tabla tocada. Responder las tres
  preguntas de `CLAUDE.md` sección 8.8 (¿qué ve un anónimo? ¿qué ve otra
  empresa? ¿qué ve un rol inferior?) por escrito en la bitácora.
  - Verificación: las nueve preguntas del checklist tienen respuesta, no
    están vacías.
  - Reversión: N/A.
- [ ] **10.2** Cerrar la tarea: actualizar `21-ROADMAP.md` (Fase 1),
  `progress/TODO.md`, `progress/CHANGELOG.md`, mover a `tasks/done/`
  (dividiendo si supera 500 líneas, como pasó con la Fase 0).
  - Verificación: `docs/tasks/README.md` no lista un `ACTIVE-*` activo.
  - Reversión: revertir el commit de cierre.

---

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

---

## Bloqueos

- **Resend/dominio:** fuera de esta tarea por decisión del usuario
  (2026-08-08). No bloquea el resto — Supabase Auth cubre el envío de
  correo necesario para Fase 1.
- **Auth Hook (paso 7.2):** requiere una acción manual del usuario en el
  Dashboard de Supabase. Bloquea el middleware (Fase 9) hasta que se haga.

## Pendientes descubiertos

- 2FA (TOTP) para `seller`/`technician`/`master`: el roadmap lo pide en
  Fase 1, pero no hay UI de `(staff)` para configurarlo. Se implementa
  cuando existan esos paneles.
- `docs/10-INTEGRATION-RESEND.md` sigue sin escribirse — se escribe cuando
  exista dominio y se integre Resend de verdad.
- `SUPABASE_SERVICE_ROLE_KEY` todavía no está en Vercel (solo las dos
  variables públicas). Necesaria antes del paso 5.2.
