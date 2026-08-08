# TAREA: Fase 1 — Identidad y datos (parte D: cierre, paso 10.1)

Parte A (plan): [`ACTIVE-fase-1-identidad-datos-A.md`](./ACTIVE-fase-1-identidad-datos-A.md) · Parte B (bitácora 1.1–4.1): [`ACTIVE-fase-1-identidad-datos-B.md`](./ACTIVE-fase-1-identidad-datos-B.md) · Parte C (bitácora 4.2–9.1): [`ACTIVE-fase-1-identidad-datos-C.md`](./ACTIVE-fase-1-identidad-datos-C.md)

## Paso 10.1 — Checklist de seguridad (05-RLS-SECURITY.md sección 9)

### `profiles`

- **RLS habilitada:** sí, desde el primer commit (2.1), sin políticas hasta 3.1.
- **Probada como anónimo / otra empresa / rol inferior:** sí (3.1, execute_sql con JWT simulado; helpers de vitest en 4.1 con JWT real).
- **¿Qué ve un anónimo?** Nada — `profiles_self` es `to authenticated`, sin política para `anon`.
- **¿Qué ve otra empresa?** N/A directo (profiles no tiene FK a empresa), pero un usuario A no ve el perfil de un usuario B salvo que A sea `master` (`profiles_self`).
- **¿Qué ve un rol inferior?** Un `customer` ve solo su propio perfil; no puede leer ni escribir el de nadie más. `profiles_update_self` impide auto-promoción de rol (`check` compara contra `auth_role()`).
- **Zod:** sí — `registerSchema` valida `fullName`/`email`/`password`/`documentNumber`/consentimiento antes de tocar la base.
- **`service_role` fuera del servidor:** no — `createServiceRoleClient` solo se instancia en Server Actions (`apps/web/app/(auth)/*/actions.ts`) y en `packages/core`, nunca en un componente cliente.
- **`audit_log`:** el registro (alta inicial, rol `customer` por defecto vía trigger) no es un "cambio de rol" en el sentido de `06-AUTH-ROLES.md` sección 6 (eso aplica a cuando un `master` cambia el rol de otro usuario, vía `/api/v1/admin/users/:id/role` — endpoint todavía no construido, Fase futura). No aplica todavía.
- **Errores crudos al cliente:** no — `registerUser`/`loginAction`/etc. atrapan errores y devuelven mensajes propios en español; nunca se expone un mensaje de Postgres tal cual.

### `companies`

- **RLS habilitada:** sí (2.2), políticas desde 3.2.
- **Probada:** sí (3.2, dos empresas + outsider + vendedor asignado; reverificada en 3.3 tras abrir `company_members`).
- **¿Qué ve un anónimo?** Nada — `companies_read`/`companies_update_own` son `to authenticated`.
- **¿Qué ve otra empresa?** Nada — un miembro de la empresa X no ve ni una fila de la empresa Y (verificado con `execute_sql` y con el `rls-tests` de CI).
- **¿Qué ve un rol inferior?** Un `buyer` lee su propia empresa pero no puede actualizarla (`companies_update_own` exige `owner`/`accounting` o `master`).
- **Zod / `service_role` / `audit_log` / errores crudos:** mismo análisis que `profiles` — la creación de empresa en el registro usa `service_role` desde el servidor (RLS de `companies` no tiene política de `insert`, intencional: el master es dueño del contenido comercial, la creación en registro es la única excepción, controlada por `packages/core`).

### `company_members`

- **RLS habilitada:** sí (2.2), política desde 3.3.
- **Probada:** sí (3.3, dos empresas, outsider).
- **¿Qué ve un anónimo?** Nada.
- **¿Qué ve otra empresa?** Nada — un miembro de X no ve membresías de Y (`members_read` usa `auth_company_ids()`, `security definer`, sin recursión).
- **¿Qué ve un rol inferior?** Cualquier miembro ve las membresías de su propia empresa (lectura no distingue `owner`/`buyer`); no hay política de `insert`/`update`/`delete` — toda alta pasa por `service_role` desde `packages/core`.

### `settings`

- **RLS habilitada:** sí (2.3), **sin ninguna política** (decisión de esta tarea, `DECISIONS.md` 2026-08-08) — bloqueada incluso para `master`.
- **¿Qué ve un anónimo / otra empresa / rol inferior?** Nada, nadie, vía cliente. Solo `service_role` desde el servidor.
- **`audit_log`:** cambios a `settings` (ej. `quote_threshold_cop`) deberán auditarse cuando exista el panel de Fase 5 — anotado en "Pendientes descubiertos".

### `audit_log`

- **RLS habilitada:** sí (2.4), política desde 3.4 — solo `select` para `master`, inmutable (sin `insert`/`update`/`delete` vía cliente).
- **Probada:** sí (3.4 — customer no ve ni inserta, master lee pero no puede modificar ni borrar).
- **¿Qué ve un anónimo / otra empresa / rol inferior?** Nada, salvo `master`, que solo lee.

### Checklist de las ocho preguntas (una vez, para toda la fase)

1. **¿Toda tabla nueva tiene `enable row level security`?** Sí, las 5 (`profiles`, `companies`, `company_members`, `settings`, `audit_log`), desde el mismo commit que las crea.
2. **¿Probé como anónimo, otra empresa y rol inferior?** Sí — a nivel SQL con JWT simulado (3.1–3.4) y a nivel HTTP real con `signInWithPassword` (4.1, corrido en verde en CI desde 4.2).
3. **¿Algún endpoint nuevo devuelve precios sin validar sesión?** N/A esta fase — no hay catálogo ni precios todavía (Fase 2 del roadmap).
4. **¿Validé la entrada con Zod?** Sí — `registerSchema`, `loginSchema`, `requestResetSchema`, `confirmPasswordSchema`, todas via `safeParse` antes de tocar Supabase.
5. **¿Hay algún `service_role` fuera del servidor?** No — `createServiceRoleClient` (`packages/db`) solo se llama desde Server Actions y `packages/core`; `SUPABASE_SERVICE_ROLE_KEY` nunca lleva prefijo `NEXT_PUBLIC_`, nunca llega al navegador.
6. **¿La operación quedó en `audit_log` si toca precio, rol, pedido o cotización?** No aplica todavía — el registro asigna rol `customer` por defecto (no es un cambio de rol hecho por un master). El endpoint de cambio de rol (`06-AUTH-ROLES.md` sección 6) es Fase futura.
7. **¿Algún error de base de datos llega crudo al cliente?** No — todas las Server Actions atrapan errores y devuelven mensajes propios en español.
8. **¿Los archivos nuevos de R2 se sirven firmados?** N/A — R2 no se tocó en esta fase (Fase 4 del roadmap).

### Las tres preguntas de CLAUDE.md sección 8.8

- **¿Qué ve un anónimo?** Nada de las tablas de identidad — ni perfiles, ni empresas, ni membresías, ni configuración, ni auditoría. Ve el catálogo público (sin precio) y el blog, que no se tocaron en esta fase.
- **¿Qué ve otra empresa?** Nada — probado explícitamente con dos empresas reales (X/Y) en `companies` y `company_members`, aislamiento confirmado tanto a nivel SQL como con usuarios reales autenticados vía HTTP.
- **¿Qué ve un rol inferior?** Ve exactamente lo que le corresponde: su propio perfil, su propia empresa (lectura siempre, escritura solo `owner`/`accounting`), nunca `audit_log` (exclusivo de `master`), nunca `settings` (exclusivo de `service_role`).

**Resultado:** las ocho preguntas y las tres de `CLAUDE.md` tienen respuesta, ninguna vacía. Paso 10.1 cerrado.
