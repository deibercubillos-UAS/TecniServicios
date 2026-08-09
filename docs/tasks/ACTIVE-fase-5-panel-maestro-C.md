# TAREA: Fase 5 — Panel maestro y contenido (parte C: bitácora 5.1+, bloqueos, pendientes)

Parte A (plan): [`ACTIVE-fase-5-panel-maestro-A.md`](./ACTIVE-fase-5-panel-maestro-A.md)
Parte B (bitácora pasos 1.1–4.2, cerrada): [`ACTIVE-fase-5-panel-maestro-B.md`](./ACTIVE-fase-5-panel-maestro-B.md)

## Bitácora

### 5.1 `/admin/banners`

- **Qué se hizo:** `createBanner`/`updateBanner` en `packages/core`,
  `placement` validado contra whitelist en código
  (`ALLOWED_BANNER_PLACEMENTS`: `home_hero`, `catalog_top`, sin enum en
  la base — `15-MODULE-CONTENT.md`), rechazo de `startsAt >= endsAt`.
  Páginas `/admin/banners` (lista ordenada por placement/posición,
  crear, editar con `datetime-local` para vigencia). Imagen como URL
  de texto, sin subida — mismo criterio de 4.1/4.2 (sin R2).
- **Verificación:** `pnpm typecheck`/`pnpm lint` verdes en los 7
  paquetes. 6 pruebas unitarias nuevas (rechazo de imagen vacía,
  placement inválido, `startsAt`>=`endsAt`, creación, propagación de
  error, actualización) — 79/79 en `@tecni/core`. Verificación real
  vía `execute_sql`: `master` crea 3 banners (activo vigente, inactivo,
  vigencia futura) y edita el activo con su propia sesión
  (`banners_write_master`, Fase 5 paso 3.2); `anon` y `customer` solo
  ven el banner activo y vigente (`count(*) = 1` de 3, confirma
  `banners_read_public`); `customer` bloqueado en insert
  (`insufficient_privilege`) y en update (sin efecto). Limpieza
  completa confirmada con `count(*)`.
- **Archivos:** `packages/core/src/content/{manage-banner.ts,
  manage-banner.test.ts}`, `packages/core/src/index.ts`,
  `apps/web/app/(staff)/admin/banners/{page.tsx,actions.ts,
  nuevo/page.tsx,[id]/page.tsx}` (nuevos).
- **Resultado:** verificación OK. Cierra el paso 5.1. Sigue el 5.2
  (`/admin/blog`).
- **Commit:** `feat(web): /admin/banners — CRUD con vigencia y posición`

### 5.2 `/admin/blog`

- **Qué se hizo:** `createPost`/`updatePost` (contenido, siempre nace
  como borrador — `is_published` no se toca en ninguno de los dos) y
  `publishPost`/`unpublishPost` (acciones separadas, la única forma de
  cambiar `is_published`) en `packages/core`. `publishPost` acepta
  `publishedAt` opcional para programar; sin valor usa `now()`.
  Páginas `/admin/blog` (lista con badge Publicado/Borrador, fecha de
  publicación si aplica), `/admin/blog/nuevo` (crea borrador),
  `/admin/blog/[id]` (edición de contenido + bloque separado de
  publicar/despublicar con campo de fecha/hora para programar). Cuerpo
  como texto/markdown plano, sin editor WYSIWYG (fuera de alcance,
  `ACTIVE-fase-5-panel-maestro-A.md`).
- **Verificación:** `pnpm typecheck`/`pnpm lint` verdes en los 7
  paquetes. 8 pruebas unitarias nuevas (rechazo de slug/título vacío,
  creación como borrador con `author_id`, propagación de error,
  actualización sin tocar `is_published`, publicar con fecha por
  defecto, propagación de error al publicar, despublicar) — 87/87 en
  `@tecni/core`. Verificación real vía `execute_sql`: `master` crea un
  post (nace `is_published = false`), lo publica y despublica con su
  propia sesión (`posts_write_master`, Fase 5 paso 3.1); `anon` y
  `customer` solo ven el post publicado y vigente entre 3 posts
  (borrador, publicado, publicado con fecha futura) — `count(*) = 1`,
  confirma `posts_read_public`; `customer` bloqueado en insert
  (`insufficient_privilege`) y en update (sin efecto). Limpieza
  completa confirmada con `count(*)`.
- **Archivos:** `packages/core/src/content/{manage-post.ts,
  manage-post.test.ts}`, `packages/core/src/index.ts`,
  `apps/web/app/(staff)/admin/blog/{page.tsx,actions.ts,
  nuevo/page.tsx,[id]/page.tsx}` (nuevos).
- **Resultado:** verificación OK. Cierra el paso 5.2. Sigue el 5.3
  (`/admin/promociones`).
- **Commit:** `feat(web): /admin/blog — CRUD de posts con publicar/despublicar y programación`

### 5.3 `/admin/promociones`

- **Qué se hizo:** `createPromotion`/`updatePromotion` en
  `packages/core`. `discountType` validado contra whitelist
  (`ALLOWED_DISCOUNT_TYPES`: `percentage`, `fixed_amount`, sin enum en
  la base). Regla de negocio propia de esta tabla: **exactamente uno**
  de `productId`/`categoryId` (ninguno o ambos = error, validado en
  código, no hay `check` en el esquema — `15-MODULE-CONTENT.md`).
  Porcentaje acotado 0–100. Páginas `/admin/promociones` (lista con
  descuento formateado y alcance), `/admin/promociones/nueva` y
  `/admin/promociones/[id]` (radio producto/categoría, nota explícita
  de que la promoción se muestra pero no toca `resolvePrice()` —
  `PENDIENTE-DECISIÓN`).
- **Verificación:** `pnpm typecheck`/`pnpm lint` verdes en los 7
  paquetes (un ajuste de tipo en el test: `exactOptionalPropertyTypes`
  rechaza `productId: undefined` explícito, se corrigió desestructurando
  la clave en vez de asignarla a `undefined`, mismo patrón ya usado en
  toda la sesión). 8 pruebas unitarias nuevas (nombre vacío, tipo de
  descuento inválido, porcentaje > 100, ni producto ni categoría,
  producto y categoría a la vez, creación válida, propagación de
  error, actualización) — 95/95 en `@tecni/core`. Verificación real vía
  `execute_sql`: `master` crea una promoción activa y una inactiva
  (ambas con `category_id`) y edita la activa con su propia sesión
  (`promotions_write_master`, Fase 5 paso 3.3); `anon` y `customer`
  solo ven la activa (`count(*) = 1` de 2, confirma
  `promotions_read_public`); `customer` bloqueado en insert
  (`insufficient_privilege`) y en update (sin efecto). Limpieza
  completa confirmada con `count(*)`.
- **Archivos:** `packages/core/src/content/{manage-promotion.ts,
  manage-promotion.test.ts}`, `packages/core/src/index.ts`,
  `apps/web/app/(staff)/admin/promociones/{page.tsx,actions.ts,
  nueva/page.tsx,[id]/page.tsx}` (nuevos).
- **Resultado:** verificación OK. Cierra el paso 5.3 y la Fase 5 del
  plan. Sigue el 6.1 (`/admin/configuracion`).
- **Commit:** `feat(web): /admin/promociones — CRUD con alcance y vigencia`

### 6.1 `/admin/configuracion`

- **Qué se hizo:** `updateSetting(client, key, value, updatedBy)` en
  `packages/core` — genérica sobre cualquier `key` de `settings`, no
  específica de `quote_threshold_cop`; `value` es `jsonb` así que el
  llamador pasa el valor ya serializable. Página `/admin/configuracion`
  lista todos los parámetros existentes (hoy solo el umbral sembrado)
  con su descripción y fecha de última edición, un formulario por fila
  con el valor actual precargado como JSON editable (`JSON.parse` en
  el server action, mensaje explícito si no es JSON válido).
- **Verificación:** `pnpm typecheck`/`pnpm lint` verdes en los 7
  paquetes. 2 pruebas unitarias nuevas (actualiza valor y
  `updated_by`, propaga error) — 97/97 en `@tecni/core`. Verificación
  real vía `execute_sql`: `master` edita `quote_threshold_cop` con su
  propia sesión (`settings_master`, Fase 5 paso 3.4 — primera política
  real de esta tabla, antes bloqueada por completo); `customer` y
  `seller` intentan editar — ambos sin efecto (`update` no afecta
  filas bajo su sesión). Valor real de producción (`5000000`) restaurado
  y `updated_by` limpiado al final de la prueba, confirmado con
  `select` directo. Limpieza de usuarios/perfiles de prueba confirmada
  con `count(*)`.
- **Archivos:** `packages/core/src/content/{manage-setting.ts,
  manage-setting.test.ts}`, `packages/core/src/index.ts`,
  `apps/web/app/(staff)/admin/configuracion/{page.tsx,actions.ts}`
  (nuevos).
- **Resultado:** verificación OK. Cierra el paso 6.1. Sigue el 6.2
  (`/admin/usuarios`).
- **Commit:** `feat(web): /admin/configuracion — edición de settings, empieza por quote_threshold_cop`

### 6.2 `/admin/usuarios`

- **Qué se hizo:** `profiles`/`company_members` no tenían política de
  escritura para `master` (`profiles_update_self` de la Fase 1 exige
  `role = auth_role()` en su propio `with check`, bloqueando toda
  auto-escalación pero también a `master` operando sobre otro usuario
  — la comprobación es sobre `auth.uid()`, no sobre quién ejecuta). Dos
  migraciones nuevas: `change_user_role(uuid, user_role)`, función
  `security definer` que valida `is_master()` a mano y hace el update
  bypaseando RLS (mismo patrón que `auth_company_ids()`/`is_master()`,
  `revoke ... from public, anon` + `grant ... to authenticated`); y
  `company_members_write_master`, política directa para `member_role`
  (sin la restricción de auto-escalación de `profiles`, no hace falta
  función). En `packages/core`: `changeUserRole` (llama al RPC, audita
  `profile.role_changed` con `before`/`after`) y
  `changeCompanyMemberRole` (update directo, audita
  `company_member.role_changed`) — **corrige la deuda técnica de
  `registerUser`** (nunca auditó, `progress/TODO.md`) desde el primer
  uso. Página `/admin/usuarios`: lista por empresa, cada miembro con
  dos formularios (rol de plataforma vía RPC, rol interno vía update
  directo).
- **Verificación:** `pnpm typecheck`/`pnpm lint` verdes en los 7
  paquetes. 4 pruebas unitarias nuevas (RPC + auditoría, error sin
  auditar, update de `member_role` + auditoría, error sin auditar) —
  101/101 en `@tecni/core`. `get_advisors` (seguridad) tras las
  migraciones: mismas advertencias ya aceptadas de siempre
  (`auth_role`/`auth_company_ids`/`auth_assigned_equipment_ids`
  ejecutables por `authenticated`) más una nueva idéntica para
  `change_user_role` — mismo patrón intencional, la función valida
  `is_master()` internamente. Verificación real vía `execute_sql`:
  `master` cambia el rol de plataforma de un `customer` a `seller` vía
  `change_user_role()` y el `member_role` de `buyer` a `owner` con su
  propia sesión; `customer` bloqueado tanto en el RPC
  (`insufficient_privilege`) como en un `update` directo sobre su
  propio `role` (RLS lo rechaza con error, no en silencio — confirma
  que `profiles_update_self` sigue intacta); `seller` bloqueado en
  ambos caminos sobre otro usuario. Limpieza completa confirmada con
  `count(*)`.
- **Archivos:** `packages/db/migrations/{20260809280000_change_user_role_function.sql,
  20260809290000_company_members_write_master.sql}`,
  `packages/core/src/companies/{change-user-role.ts,
  change-user-role.test.ts}`, `packages/core/src/index.ts`,
  `apps/web/app/(staff)/admin/usuarios/{page.tsx,actions.ts}` (nuevos).
- **Resultado:** verificación OK. Cierra el paso 6.2 y la Fase 6 del
  plan. Sigue el 7.1 (`/admin/auditoria`).
- **Commit:** `feat(web): /admin/usuarios — cambio de rol auditado, corrige deuda de registerUser`

### 7.1 `/admin/auditoria`

- **Qué se hizo:** solo UI — `audit_log` ya tenía RLS completa desde
  la Fase 1 (`audit_read_master`: solo `select`, solo `master`, sin
  política de `update`/`delete` para nadie). Página
  `/admin/auditoria`: tabla de los últimos 100 registros
  (fecha/actor/acción/entidad/antes/después), filtros por `entity`,
  `actor_id`, rango de fechas.
- **Verificación:** `pnpm typecheck`/`pnpm lint` verdes en los 7
  paquetes (sin pruebas unitarias nuevas — no hay función de
  `packages/core`, es un visor puro sobre RLS ya existente).
  Verificación real vía `execute_sql`: `master` lee un registro de
  prueba y el filtro por `entity` lo encuentra; `customer` y `seller`
  ven `count(*) = 0` sobre el mismo id. **Hallazgo real de la prueba
  (no del código):** el primer intento de verificar inmutabilidad
  escribió `update ... where id = ...; raise exception 'FALLO...'`
  sin condicionar al resultado real — un `update` sin política
  aplicable no lanza error, solo afecta 0 filas en silencio, así que
  la prueba original disparaba el `FALLO` siempre, sin importar si el
  `update` tuvo efecto. Corregido re-consultando el valor después del
  `update`/`delete`: confirmado que ni siquiera `master` puede editar
  o borrar una fila de `audit_log` — coherente con "inmutable" de
  `05-RLS-SECURITY-A.md`. Limpieza completa confirmada con `count(*)`.
- **Archivos:** `apps/web/app/(staff)/admin/auditoria/page.tsx` (nuevo).
- **Resultado:** verificación OK. Cierra el paso 7.1. Sigue el 7.2
  (`/admin/metricas`).
- **Commit:** `feat(web): /admin/auditoria — visor de audit_log con filtros`

### 7.2 `/admin/metricas`

- **Qué se hizo:** solo UI — página `/admin/metricas` con conteos
  reales (`count`, `head: true`, sin traer filas): pedidos agrupados
  por cada uno de los 6 estados del enum `order_status`, cotizaciones
  abiertas (`requested`/`in_progress`/`sent`), tickets abiertos
  (`open`/`assigned`/`waiting_customer`), mantenimientos pendientes
  (`requested`/`confirmed`/`rescheduled`). Sin gráficas ni cifras
  fabricadas — fuera de alcance de esta fase
  (`ACTIVE-fase-5-panel-maestro-A.md`), mismo criterio que el
  placeholder de estadísticas del home.
- **Verificación:** `pnpm typecheck`/`pnpm lint` verdes en los 7
  paquetes (sin pruebas unitarias — no hay función de `packages/core`,
  las políticas de lectura de `orders`/`quotes`/`support_tickets`/
  `maintenance_requests` ya existen desde fases previas, todas con
  `is_master()`). Verificación real vía `execute_sql`: se insertó un
  pedido `paid`, una cotización `requested`, un ticket `open` y un
  mantenimiento `requested` reales (con sus columnas obligatorias
  completas — `order_number`/`placed_by`/`subtotal_cop`/`tax_cop` en
  `orders`, `ticket_number` en `support_tickets`, `company_id` en
  `maintenance_requests`, ninguna documentada explícitamente antes de
  intentar el insert, ajustadas por prueba y error hasta cumplir los
  `not null`); `master` los cuenta correctamente con su propia sesión;
  un `seller` ajeno a la empresa no ve el pedido (`count(*) = 0`).
  Limpieza completa confirmada con `count(*)`.
- **Archivos:** `apps/web/app/(staff)/admin/metricas/page.tsx` (nuevo).
- **Resultado:** verificación OK. Cierra el paso 7.2 y la Fase 7 del
  plan. Sigue el 8.1 (checklist de seguridad de cierre).
- **Commit:** `feat(web): /admin/metricas — conteos reales de pedidos, cotizaciones, tickets y mantenimientos`

### 8.1 Checklist de seguridad de cierre

Revisión de las 8 preguntas de `05-RLS-SECURITY-B.md` sección 9 y las
tres de `CLAUDE.md` sobre **todo lo construido en la Fase 5** (pasos
1.1 a 7.2). No se revisa código otra vez paso a paso — cada paso ya
verificó su propia RLS con datos reales; esto es la pasada de cierre
que busca huecos entre pasos.

- **¿Toda tabla nueva tiene RLS?** Sí — `posts`, `banners`,
  `promotions` nacieron con `enable row level security` en la misma
  migración que las creó (paso 2.1–2.3), políticas después (Fase 3).
  `settings` ya la tenía desde la Fase 1.
- **¿Probado como anónimo, otra empresa, rol inferior?** Sí en cada
  paso con contenido público (`posts`/`banners`/`promotions`: `anon`
  y `customer` limitados a lo activo/publicado/vigente, `count()`
  verificado contra el total real insertado, no solo "no truena").
  Para `/admin/usuarios`/`/admin/configuracion`: `customer` y `seller`
  bloqueados en escritura, incluida la auto-escalación de rol
  (bloqueada por `profiles_update_self`, ya existente, no tocada).
  `/admin/metricas`: un `seller` ajeno a la empresa de prueba no ve
  sus pedidos.
- **¿Algún endpoint nuevo devuelve precios sin validar sesión?** No —
  ningún endpoint de esta fase toca `price_cop`/`stock_status`.
  `createProduct`/`updateProduct` (paso 4.1) excluyen esos campos del
  payload explícitamente, verificado por prueba unitaria.
- **¿Validé la entrada con Zod?** No — **deuda técnica preexistente
  del proyecto completo** (`progress/TODO.md`: "Ningún Server Action
  del proyecto valida con Zod"), no algo que esta fase haya empeorado.
  La validación de esta fase es manual en `packages/core` (slug/nombre
  vacíos, whitelists de `placement`/`discountType`, rango de
  porcentaje, exactamente-uno para alcance de promoción) — cubre los
  casos reales, pero no es Zod. Se deja igual que el resto del
  proyecto hasta que se resuelva esa deuda de forma transversal.
- **¿Hay algún `service_role` fuera del servidor?** No —
  `createServiceRoleClient` solo aparece en dos `actions.ts` (`"use
  server"`, `/admin/usuarios`), nunca en un componente cliente ni
  expuesto al navegador.
- **¿La operación quedó en `audit_log` si toca precio, rol, pedido o
  cotización?** Sí, y es el hallazgo explícito del paso 6.2:
  `changeUserRole`/`changeCompanyMemberRole` auditan desde el primer
  uso (`profile.role_changed`, `company_member.role_changed`),
  corrigiendo la deuda de `registerUser`. El resto de mutaciones de
  esta fase (productos, categorías, marcas, banners, posts,
  promociones, settings) no tocan ninguna de las cuatro categorías de
  la regla de oro 8 — correctamente no auditan.
- **¿Algún error de base de datos llega crudo al cliente?** No — todo
  `actions.ts` de esta fase captura con `err instanceof Error ?
  err.message : "mensaje genérico"`, y los `message` que puede traer
  `err` son siempre los propios de `packages/core` (`"No se pudo
  crear...", "No se pudo actualizar..."`), nunca el error crudo de
  Postgres/Supabase.
- **¿Los archivos nuevos de R2 se sirven firmados?** No aplica — cero
  subida de archivos en esta fase, todo imagen/manual es URL de texto
  externo (desviación deliberada documentada desde el paso 0 del plan,
  `11-STORAGE-R2.md` sigue sin empezar).

**Las tres preguntas de `CLAUDE.md` (sección 8), aplicadas a cada
superficie nueva:**
- **¿Qué ve un anónimo?** Catálogo de contenido público
  (`posts`/`banners`/`promotions` activos y vigentes) — nada de
  `/admin/*`, todas sus rutas exigen `master` vía middleware
  (`ROUTE_RULES`, sin cambios esta fase).
- **¿Qué ve otra empresa?** Nada distinto — ninguna tabla de esta fase
  es específica de empresa salvo el cambio de `member_role` en
  `/admin/usuarios`, y `company_members_write_master` exige `master`
  para tocar cualquier fila, de cualquier empresa.
- **¿Qué ve un rol inferior?** `seller`/`technician`/`customer`
  bloqueados en escritura en las siete tablas nuevas de esta fase
  (verificado con `insufficient_privilege` o update sin efecto en
  cada paso); lectura de contenido público sin restricción adicional
  (mismo nivel que `anon`, no hay dato sensible ahí).

**Resultado:** checklist completo, sin hallazgos nuevos. Cierra el
paso 8.1. Sigue el 8.2 (roadmap/TODO/CHANGELOG, mover a `tasks/done/`).

## Bloqueos

- **R2 sin empezar:** bloquea subir imágenes/manuales reales
  (`docs/11-STORAGE-R2.md`). No bloquea el resto de la fase — el CRUD
  usa campos de texto/URL mientras tanto.

## Pendientes descubiertos

Ninguno todavía.
