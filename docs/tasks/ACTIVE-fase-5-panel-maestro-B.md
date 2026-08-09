# TAREA: Fase 5 — Panel maestro y contenido (parte B: bitácora, bloqueos, pendientes)

Parte A (plan): [`ACTIVE-fase-5-panel-maestro-A.md`](./ACTIVE-fase-5-panel-maestro-A.md)

## Bitácora

### 2026-08-09 — paso 1.1 (docs/15-MODULE-CONTENT.md)

- **Hecho:** escrito `docs/15-MODULE-CONTENT.md` — patrón único de
  visibilidad para `posts`/`banners`/`promotions` (público ve solo lo
  activo/publicado/vigente, `master` escribe todo), programación de
  blog (`is_published` + `published_at` futuro, sin estado nuevo de
  enum), `placement`/`discount_type` documentados como lista blanca en
  código (no hay enum en el esquema, mismo patrón que
  `getAllowedCatalogSorts` de la Fase 2), aplicación real del
  descuento de promociones marcada `PENDIENTE-DECISIÓN` (se muestra,
  no toca `resolvePrice()` todavía). Roles: solo `master` escribe, el
  matiz de `seller` con borrador de blog documentado como fuera de
  alcance de esta fase.
- **Archivos:** `docs/15-MODULE-CONTENT.md` (nuevo, 90 líneas),
  `docs/00-INDEX.md` (estado 15 → ✅).
- **Resultado:** verificación OK, bajo el límite de 500 líneas.
- **Commit:** `docs(content): agrega 15-MODULE-CONTENT.md`

### 2026-08-09 — paso 1.2 (docs/16-ADMIN-MASTER.md)

- **Hecho:** escrito `docs/16-ADMIN-MASTER.md` — catálogo (CRUD de
  contenido, nunca precio/stock), contenido (referencia a
  `15-MODULE-CONTENT.md`, no repite), configuración (`settings` abre su
  primera política real esta fase), usuarios y roles (`/admin/usuarios`
  audita desde el día uno, a diferencia de `registerUser`), auditoría
  (visor sobre la política ya existente desde Fase 1), métricas (solo
  conteos reales, sin fabricar cifras — mismo criterio que el
  placeholder del home). Fuera de alcance explícito: R2, aplicar
  descuentos, editor WYSIWYG, exportar.
- **Archivos:** `docs/16-ADMIN-MASTER.md` (nuevo, 114 líneas),
  `docs/00-INDEX.md` (estado 16 → ✅).
- **Resultado:** verificación OK, bajo el límite de 500 líneas. **Cierra
  la Fase 1 (documentación) de la tarea.**
- **Commit:** `docs(admin): agrega 16-ADMIN-MASTER.md`

### 2026-08-09 — paso 1.3 (sección RLS "Contenido y configuración")

- **Hecho:** agregada la sección "Contenido y configuración" en
  `05-RLS-SECURITY-C.md` — `posts_read_public`/`posts_write_master`,
  `banners_read_public`/`banners_write_master`,
  `promotions_read_public`/`promotions_write_master` (los tres con el
  mismo patrón: público ve solo lo activo/publicado/vigente, `master`
  ve y escribe todo), y `settings_master` — **primera política real**
  de `settings` desde que quedó bloqueada por completo en la Fase 1.
  **Decisión tomada en este paso** (el plan la dejaba abierta): el
  resto del proyecto que necesita `quote_threshold_cop` sigue leyendo
  vía `service_role` (carrito, checkout) — `settings_master` es
  únicamente para que `/admin/configuracion` funcione con la sesión
  real de `master`, no una apertura general de la tabla.
- **Archivos:** `docs/05-RLS-SECURITY-C.md`.
- **Resultado:** verificación OK, bajo el límite de 500 líneas.
  Verificación real con datos queda para la Fase 3 de esta tarea (pasos
  3.1–3.5), todavía sin migración aplicada.
- **Commit:** `docs(admin): completa la sección RLS de contenido y configuración`

### 2026-08-09 — paso 2.1 (migración posts)

- **Hecho:** aplicada
  `packages/db/migrations/20260809210000_create_posts.sql` — exacta a
  `04-DATABASE-SCHEMA-B.md` sección 7. RLS habilitada, cero políticas.
- **Verificación:** `information_schema.columns` confirma 13 columnas
  (exacto al esquema). `pg_class.relrowsecurity = true`, `pg_policies`
  con 0 filas.
- **Archivos:** `packages/db/migrations/20260809210000_create_posts.sql`
  (nuevo).
- **Resultado:** verificación OK. Cierra el paso 2.1. Sigue el 2.2
  (`banners`).
- **Commit:** `feat(db): crea posts`

### 2026-08-09 — paso 2.2 (migración banners)

- **Hecho:** aplicada
  `packages/db/migrations/20260809220000_create_banners.sql` — exacta a
  `04-DATABASE-SCHEMA-B.md` sección 7. RLS habilitada, cero políticas.
- **Verificación:** `information_schema.columns` confirma 10 columnas
  (exacto al esquema). `pg_class.relrowsecurity = true`, `pg_policies`
  con 0 filas.
- **Archivos:**
  `packages/db/migrations/20260809220000_create_banners.sql` (nuevo).
- **Resultado:** verificación OK. Cierra el paso 2.2. Sigue el 2.3
  (`promotions`).
- **Commit:** `feat(db): crea banners`

### 2026-08-09 — paso 2.3 (migración promotions)

- **Hecho:** aplicada
  `packages/db/migrations/20260809230000_create_promotions.sql` —
  exacta a `04-DATABASE-SCHEMA-B.md` sección 7. RLS habilitada, cero
  políticas.
- **Verificación:** `information_schema.columns` confirma 10 columnas
  (exacto al esquema). `pg_class.relrowsecurity = true`, `pg_policies`
  con 0 filas.
- **Archivos:**
  `packages/db/migrations/20260809230000_create_promotions.sql`
  (nuevo).
- **Resultado:** verificación OK. **Cierra el paso 2.3 y la Fase 2
  completa** (las 3 tablas de contenido creadas). Sigue el 2.4
  (`get_advisors` de cierre).
- **Commit:** `feat(db): crea promotions`

### 2026-08-09 — paso 2.4 (get_advisors de cierre de Fase 2)

- **Hecho:** corrido `get_advisors` (tipo `security`) tras crear las 3
  tablas de contenido. Resultado: 5 INFO `rls_enabled_no_policy` (las 3
  tablas nuevas — `posts`/`banners`/`promotions`, esperado hasta la
  Fase 3 de esta tarea, + los 2 ya justificados desde antes
  `product_documents`/`settings`), el mismo ERROR de `public_products`
  ya justificado, los mismos 3 WARN de funciones `security definer`
  ya justificados. Nada nuevo sin explicar.
- **Archivos:** ninguno (paso de solo lectura).
- **Resultado:** verificación OK. **Cierra la Fase 2 (esquema) de la
  tarea.** Sigue la Fase 3 (RLS real: anónimo, otra empresa, rol
  inferior).
- **Commit:** N/A (sin cambios de archivo, solo bitácora)

### 2026-08-09 — paso 3.1 (RLS de posts)

- **Hecho:** aplicada
  `packages/db/migrations/20260809240000_posts_rls_policies.sql` —
  `posts_read_public` (`is_published = true` y `published_at <=
  now()`), `posts_write_master` (todo, incluidos borradores y posts
  con fecha futura).
- **Verificación:** real vía `execute_sql`: 3 posts reales (publicado y
  vigente, borrador, publicado con fecha futura). `anon` ve solo el
  publicado y vigente (1 de 3); `master` ve los 3; `customer` intenta
  insertar y choca con `insufficient_privilege`; `master` publica el
  borrador (`update`) y **de inmediato** `anon` lo ve — confirma que
  "programar" es exactamente la combinación de las dos columnas, sin
  ningún paso extra. Limpieza completa confirmada con `count(*)`.
- **Archivos:**
  `packages/db/migrations/20260809240000_posts_rls_policies.sql`
  (nuevo).
- **Resultado:** verificación OK. Cierra el paso 3.1. Sigue el 3.2
  (`banners`).
- **Commit:** `feat(db): políticas RLS de posts — público ve solo lo publicado y vigente, master escribe todo`

### 2026-08-09 — paso 3.2 (RLS de banners)

- **Hecho:** aplicada
  `packages/db/migrations/20260809250000_banners_rls_policies.sql` —
  `banners_read_public` (`is_active = true` y dentro de vigencia,
  fechas nulas = siempre vigente), `banners_write_master` (todo,
  incluidos inactivos y fuera de vigencia).
- **Verificación:** real vía `execute_sql`: 4 banners reales (activo
  sin fechas, inactivo, activo pero vencido, activo pero con
  `starts_at` futuro). `anon` ve solo el activo sin fechas (1 de 4);
  `master` ve los 4; `customer` intenta insertar y choca con
  `insufficient_privilege`. Limpieza completa confirmada con
  `count(*)`.
- **Archivos:**
  `packages/db/migrations/20260809250000_banners_rls_policies.sql`
  (nuevo).
- **Resultado:** verificación OK. Cierra el paso 3.2. Sigue el 3.3
  (`promotions`).
- **Commit:** `feat(db): políticas RLS de banners — público ve solo lo activo y vigente, master escribe todo`

### 2026-08-09 — paso 3.3 (RLS de promotions)

- **Hecho:** aplicada
  `packages/db/migrations/20260809260000_promotions_rls_policies.sql`
  — `promotions_read_public`/`promotions_write_master`, mismo patrón
  exacto que `banners`.
- **Verificación:** real vía `execute_sql`: 3 promociones reales
  (activa sin fechas, inactiva, activa pero vencida). `anon` ve solo
  la activa y vigente (1 de 3); `master` ve las 3; `customer` intenta
  insertar y choca con `insufficient_privilege`. Limpieza completa
  confirmada con `count(*)`.
- **Archivos:**
  `packages/db/migrations/20260809260000_promotions_rls_policies.sql`
  (nuevo).
- **Resultado:** verificación OK. Cierra el paso 3.3. Sigue el 3.4
  (`settings`).
- **Commit:** `feat(db): políticas RLS de promotions — mismo patrón que banners`

### 2026-08-09 — paso 3.4 (RLS de settings — primera política real)

- **Hecho:** aplicada
  `packages/db/migrations/20260809270000_settings_rls_policy.sql` —
  `settings_master` (`for all`, `master` lee y escribe por su propia
  sesión). Primera política de `settings` desde que quedó bloqueada
  por completo en la Fase 1 — todo lo demás del proyecto que necesita
  `quote_threshold_cop` sigue leyendo vía `service_role`, esto no
  cambia.
- **Hallazgo real durante la verificación (no de RLS, del propio
  script de prueba):** el primer intento de limpieza falló —
  `settings.updated_by` quedó apuntando al `profile` de prueba
  (`master` real actualizó la fila real de `quote_threshold_cop`
  durante la prueba, como se esperaba), y `delete from profiles`
  chocó con la FK. Corregido reseteando `updated_by = null` antes de
  borrar los perfiles de prueba — **el valor real del umbral
  (`5000000`) nunca se alteró**, confirmado antes y después con
  `select`.
- **Verificación:** real vía `execute_sql`: `anon` y `customer` no ven
  ninguna fila de `settings`; `master` lee `quote_threshold_cop` con
  su propia sesión (`5000000`, el valor real sembrado desde la Fase 0)
  y lo actualiza; `customer` intenta cambiarlo y el valor queda
  intacto. Limpieza completa confirmada — `settings` con su valor y
  `updated_by` originales, sin usuarios de prueba residuales.
- **Archivos:**
  `packages/db/migrations/20260809270000_settings_rls_policy.sql`
  (nuevo).
- **Resultado:** verificación OK. **Cierra el paso 3.4 y la Fase 3
  (RLS) completa de esta tarea.** Sigue la Fase 4 (panel: catálogo).
- **Commit:** `feat(db): política RLS de settings — master lee y escribe por sesión propia`

### 2026-08-09 — paso 3.5 (get_advisors de cierre de Fase 3)

- **Hecho:** corrido `get_advisors` (tipo `security`) tras abrir todas
  las políticas de contenido y configuración. Resultado: **1 solo**
  INFO `rls_enabled_no_policy` (`product_documents`, ya justificado
  desde antes — `posts`/`banners`/`promotions`/`settings` ya no
  aparecen, las cuatro tienen política real ahora), el mismo ERROR de
  `public_products` ya justificado, los mismos 3 WARN de funciones
  `security definer` ya justificados. Nada nuevo sin explicar.
- **Archivos:** ninguno (paso de solo lectura).
- **Resultado:** verificación OK. Cierra el paso 3.5 y confirma el
  cierre de la Fase 3 (RLS) de la tarea — las 4 tablas de contenido y
  configuración con políticas reales, probadas con datos reales. Sigue
  la Fase 4 (panel: catálogo).
- **Commit:** N/A (sin cambios de archivo, solo bitácora)

### 2026-08-09 — paso 4.1 (/admin/productos)

- **Hecho:** `packages/core/src/catalog/manage-product.ts` —
  `createProduct(client, input)` y `updateProduct(client, productId,
  input)`: contenido puro (nombre, descripciones, tipo, categoría,
  marca, serializado, garantía, activo, destacado). **Ningún campo de
  precio ni stock** en ninguno de los dos — ni siquiera como parámetro
  opcional, no está en la interfaz. `updateProduct` tampoco acepta
  `sku`/`slug` — son la clave de sincronización con Siigo y enlaces ya
  indexados, cambiarlos es una decisión aparte, no un campo más.
  `apps/web/app/(staff)/admin/productos/{page.tsx,actions.ts,
  nuevo/page.tsx,[id]/page.tsx}` — lista con búsqueda por nombre
  (`ilike`), formulario de creación (con `sku`/`slug`) y edición (sin
  ellos, mostrados como texto no editable con la razón explicada en la
  propia pantalla).
  **Desviación del plan original:** sin editor de atributos por
  categoría (`attribute_definitions`/`product_attributes`) en este
  paso — el formulario cubre los campos propios de `products`, no las
  specs dinámicas por categoría. Se agrega como paso aparte si hace
  falta, no se fabrica un editor genérico a medias.
- **Verificación:** `pnpm typecheck`/`pnpm lint` verdes en los 7
  paquetes. 5 pruebas unitarias nuevas de `createProduct`/
  `updateProduct` (crea sin precio/stock, rechaza sku vacío, propaga
  error de la base, actualiza sin tocar sku/slug, rechaza nombre
  vacío) — 63/63 en `@tecni/core`. Verificación real vía `execute_sql`:
  `master` crea un producto con su propia sesión
  (`products_write_master`, ya aplicada desde la Fase 2); `customer`
  intenta crear y choca con `insufficient_privilege`; `master` edita
  el nombre sin que el `sku` cambie; `customer` intenta editar y no
  tiene efecto. Limpieza completa confirmada con `count(*)`.
- **Archivos:** `packages/core/src/catalog/{manage-product.ts,
  manage-product.test.ts}`, `packages/core/src/index.ts`,
  `apps/web/app/(staff)/admin/productos/{page.tsx,actions.ts,
  nuevo/page.tsx,[id]/page.tsx}` (nuevos).
- **Resultado:** verificación OK. Cierra el paso 4.1. Sigue el 4.2
  (`/admin/categorias` y `/admin/marcas`).
- **Commit:** `feat(web): /admin/productos — CRUD de contenido, nunca precio ni stock`

### 4.2 `/admin/categorias` y `/admin/marcas`

- **Qué se hizo:** `createCategory`/`updateCategory` y `createBrand`/
  `updateBrand` en `packages/core` (mismo patrón que 4.1, sin campos
  de precio/stock — no aplica en estas tablas). Páginas
  `/admin/categorias` (lista + búsqueda por nombre implícita en el
  orden, crear, editar con selector de categoría padre excluyéndose a
  sí misma) y `/admin/marcas` (lista, crear, editar con `logoUrl` como
  campo de texto — sin subida real, mismo criterio que 4.1).
- **Verificación:** `pnpm typecheck`/`pnpm lint` verdes en los 7
  paquetes. 10 pruebas unitarias nuevas (5 categorías + 5 marcas:
  rechazo de slug/nombre vacío, creación, propagación de error,
  actualización) — 73/73 en `@tecni/core`. Verificación real vía
  `execute_sql`: `master` crea y edita categoría y marca con su propia
  sesión (`categories_write_master`/`brands_write_master`, ya
  aplicadas desde la Fase 2); `customer` intenta crear categoría y
  marca — ambos chocan con `insufficient_privilege`; `customer`
  intenta editar marca — sin efecto (nombre no cambia). Limpieza
  completa confirmada con `count(*)`.
- **Archivos:** `packages/core/src/catalog/{manage-category.ts,
  manage-category.test.ts,manage-brand.ts,manage-brand.test.ts}`,
  `packages/core/src/index.ts`,
  `apps/web/app/(staff)/admin/categorias/{page.tsx,actions.ts,
  nueva/page.tsx,[id]/page.tsx}`,
  `apps/web/app/(staff)/admin/marcas/{page.tsx,actions.ts,
  nueva/page.tsx,[id]/page.tsx}` (nuevos).
- **Resultado:** verificación OK. Cierra el paso 4.2 y la Fase 4 del
  plan. Sigue el 5.1 (`/admin/banners`).
- **Commit:** `feat(web): /admin/categorias y /admin/marcas — CRUD simple`

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

## Bloqueos

- **R2 sin empezar:** bloquea subir imágenes/manuales reales
  (`docs/11-STORAGE-R2.md`). No bloquea el resto de la fase — el CRUD
  usa campos de texto/URL mientras tanto.

## Pendientes descubiertos

Ninguno todavía.
