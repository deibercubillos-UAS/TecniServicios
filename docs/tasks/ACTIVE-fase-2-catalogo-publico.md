# TAREA: Fase 2 — Catálogo público

**Estado:** En curso · **Riesgo:** Riesgoso
**Inicio:** 2026-08-08

## Objetivo

Un catálogo navegable sin precios para anónimos: categorías, marcas, productos
con especificaciones por categoría, listado con filtros, búsqueda, ficha,
comparador, home migrado de Stitch, contacto, SEO sin precios.

**No entra en esta tarea:**
- Comercio (carrito, checkout, Wompi) — Fase 3.
- Postventa real (equipos adquiridos, manuales privados, mantenimiento) —
  Fase futura. `product_documents` queda con RLS bloqueada (sin políticas):
  el acceso real a manuales depende de haber comprado, que no existe todavía.
- Blog (`posts`) y banners — el roadmap de la Fase 2 no los pide en el
  criterio de "listo cuando"; se hacen cuando exista `15-MODULE-CONTENT.md`.
- Integración real con Siigo — se usa `SiigoMockClient` (credenciales
  siguen `PENDIENTE-DECISIÓN` en `progress/TODO.md`).
- Inventario real de productos — sigue bloqueante en `progress/TODO.md`.
  Esta tarea usa datos de prueba (2–3 categorías, 5–10 productos) para
  poder verificar filtros/búsqueda/comparador con algo real.

## Documentos consultados

- `docs/04-DATABASE-SCHEMA-A.md` sección 4 — esquema exacto de catálogo.
- `docs/05-RLS-SECURITY.md` secciones 1–3 — el problema de los precios,
  patrón `public_products` (vista sin precio, bypassa RLS por ser del
  dueño de la tabla) + `products` con RLS solo para `authenticated`.
- `docs/17-STITCH-MIGRATION.md` — pipeline completo, prompt base.
- `docs/21-ROADMAP.md` sección Fase 2 — criterio de "listo".
- `docs/23-TASK-EXECUTION.md` — granularidad para tareas riesgosas.
- `docs/02-DESIGN-SYSTEM.md`, `docs/03-UI-COMPONENTS.md` (vacío
  todavía — se completa según se extraigan componentes de Stitch).

## Decisiones pendientes de tomar en el camino

- Exacto de las políticas de `product_images`/`attribute_definitions`/
  `product_attributes` para lectura de `anon`: no están en
  `05-RLS-SECURITY.md` todavía (solo `products`/`categories`/`brands`
  tienen ejemplo exacto). Se diseñan en el paso 1.2, documentando ahí
  mismo, mismo patrón que la corrección de `profiles_data_consent` en
  la Fase 1.

---

## Plan

### Fase 1 — Documentación previa (regla 9 de `CLAUDE.md`)

- [x] **1.1** Escribir `docs/12-MODULE-CATALOG.md`: filtros, búsqueda,
  ficha, comparador, contrato de sincronización con Siigo (qué se
  sincroniza, qué pasa si Siigo no responde — `price_is_stale`).
  - Verificación: archivo existe, bajo 500 líneas, actualiza `00-INDEX.md`.
- [x] **1.2** Agregar sección "Catálogo" a `05-RLS-SECURITY.md` con las
  políticas exactas de `product_images`, `attribute_definitions`,
  `product_attributes`, `product_documents` (las de `categories`/
  `brands`/`products` ya están escritas, secciones 1–3).
  - Verificación: cada tabla nueva de esta fase tiene su política
    escrita antes de migrar.

### Fase 2 — Esquema, RLS bloqueada desde el primer commit

- [x] **2.1** Migración `categories` (con jerarquía `parent_id`).
- [x] **2.2** Migración `brands`.
- [x] **2.3** Migración `products` + vista `public_products`.
- [x] **2.4** Migración `product_images`.
- [x] **2.5** Migración `attribute_definitions` + `product_attributes`.
- [x] **2.6** Migración `product_documents`.
- [x] **2.7** `get_advisors` (seguridad) — cero advertencias sin justificar.

Cada paso: RLS habilitada en la misma migración que crea la tabla, sin
políticas todavía. Verificación por mecanismo (`pg_class.relrowsecurity`
+ `pg_policies` en 0), mismo patrón que la Fase 1.

### Fase 3 — Políticas RLS (permiso por permiso)

- [x] **3.1** `categories`/`brands`: lectura `anon`+`authenticated` de
  filas activas, escritura solo `master`.
- [x] **3.2** `products`: `products_read_authenticated` (`to
  authenticated`) + `products_write_master`. `public_products` (vista,
  sin `price_cop`) para `anon` — grant explícito de `select` a `anon`
  sobre la vista.
- [x] **3.3** `product_images`/`attribute_definitions`/
  `product_attributes`: lectura `anon` vía subconsulta a
  `public_products` (no a `products` directo — mismo problema de
  encadenamiento de RLS que `auth_company_ids()` en la Fase 1).
- [x] **3.4** `product_documents`: **sin políticas**, documentado por
  qué (postventa no existe todavía).
- [x] **3.5** `get_advisors` de cierre.

Cada política probada con datos de prueba reales (anon, `authenticated`
sin sesión de empresa, `master`) antes de pasar a la siguiente tabla.

### Fase 4 — Prueba de que el precio nunca llega a un anónimo

- [ ] **4.1** Script real (`packages/db/tests/rls/` o
  `packages/core/**/*.test.ts` según corresponda): confirma que
  `price_cop` no aparece ni en la respuesta de `public_products` como
  `anon`, ni en el HTML de la página de listado/ficha sin sesión —
  "ver código fuente", como pide el criterio de "listo" del roadmap.
- [ ] **4.2** Si aplica, sumar al job `rls-tests` de CI (ya existe el
  job, se extiende).

### Fase 5 — Precio real vs. mock, sin credenciales de Siigo

- [ ] **5.1** `SiigoMockClient` en `packages/integrations` — simula
  precio y stock, mismo contrato que el cliente real tendrá.
- [ ] **5.2** `resolvePrice(product, ctx)` en `packages/core` — `null`
  si `ctx.userId` es nulo. Toda la UI consume esta función, nunca
  `product.price_cop` directo (regla de `05-RLS-SECURITY.md`).

### Fase 6 — Home migrado de Stitch

- [ ] **6.1** **Punto de control manual.** El usuario genera la
  pantalla Home en Stitch con el prompt de
  `17-STITCH-MIGRATION.md` sección 3, exporta a `design/stitch/home/`.
- [ ] **6.2** Auditar (qué es estructura, qué es decoración),
  tokenizar (todo hex/tamaño/espaciado → variables de
  `02-DESIGN-SYSTEM.md` — **no negociable**), extraer componentes a
  `packages/ui`, documentar en `03-UI-COMPONENTS.md`.
- [ ] **6.3** Reconstruir en Next.js con esos componentes, verificar
  contraste, foco, teclado, responsive — checklist de
  `17-STITCH-MIGRATION.md` sección 5.

### Fase 7 — Listado, búsqueda, ficha, comparador

- [ ] **7.1** Listado con filtros por categoría, marca y atributos
  filtrables (`is_filterable`).
- [ ] **7.2** Búsqueda de texto completo en español (índice `gin` ya
  definido en el esquema).
- [ ] **7.3** Ficha de producto con especificaciones por categoría
  (`attribute_definitions`/`product_attributes`).
- [ ] **7.4** Comparador, máximo 3 productos, misma `category_id`,
  compara solo atributos `is_comparable`.

### Fase 8 — Contacto, SEO, cierre

- [ ] **8.1** Página de contacto.
- [ ] **8.2** SEO: metadatos, sitemap, JSON-LD **sin precios** —
  verificado con "ver código fuente" para un anónimo.
- [ ] **8.3** Cierre: checklist de seguridad de `05-RLS-SECURITY.md`
  sección 9 + las tres preguntas de `CLAUDE.md` 8.8, actualizar
  `21-ROADMAP.md`/`progress/TODO.md`/`progress/CHANGELOG.md`, mover a
  `tasks/done/`.

---

## Bitácora

### 2026-08-08 — paso 1.1 (docs/12-MODULE-CATALOG.md)

- **Hecho:** escrito `docs/12-MODULE-CATALOG.md` — alcance, categorías/
  marcas (jerarquía, lectura pública), especificaciones por categoría
  (`attribute_definitions`/`product_attributes`), listado y filtros
  (incluye la restricción de no ordenar por precio sin sesión — filtra
  indirectamente el precio), búsqueda de texto completo, ficha de
  producto (precio siempre vía `resolvePrice`, nunca `price_cop`
  directo), comparador, `SiigoMockClient` (contrato mínimo para
  desarrollar sin credenciales), SEO sin precios. No repite el
  contrato de sincronización de precios — remite a
  `08-INTEGRATION-SIIGO.md`, que ya lo tiene completo.
- **Archivos:** `docs/12-MODULE-CATALOG.md` (nuevo, 123 líneas),
  `docs/00-INDEX.md` (estado 12 → ✅).
- **Resultado:** verificación OK, bajo el límite de 500 líneas.
- **Commit:** `docs(catalog): agrega 12-MODULE-CATALOG.md`

### 2026-08-08 — paso 1.2 (políticas RLS de catálogo en 05-RLS-SECURITY.md)

- **Hecho:** hallazgo — `05-RLS-SECURITY.md` ya tenía la política
  exacta de `product_documents`, pero depende de `owned_equipment`
  (postventa, no existe hasta esa fase). Agregada nota explícita: hasta
  entonces `product_documents` queda con RLS habilitada y sin ninguna
  política (bloqueada por completo), no una versión recortada de la
  política real. `categories`/`brands`/`products`/`public_products` ya
  estaban documentados (secciones 3–4 existentes) — no se repitieron.
  Agregadas las que faltaban: `product_images`, `attribute_definitions`,
  `product_attributes` — lectura `anon`+`authenticated` vía subconsulta
  a `public_products` (no a `products` directo, mismo problema de
  encadenamiento de RLS que `auth_company_ids()` en la Fase 1 — la vista
  es propiedad de `postgres`, bypassa la restricción sin necesitar una
  función `security definer` aparte), escritura solo `master`.
- **Archivos:** `docs/05-RLS-SECURITY.md`.
- **Resultado:** verificación OK, 355 líneas, bajo el límite de 500.
  Fase 1 de la tarea cerrada.
- **Commit:** `docs(rls): políticas de catálogo (product_images, attribute_definitions, product_attributes)`

### 2026-08-08 — paso 2.1 (migración categories)

- **Hecho:** aplicada `create_categories` vía `apply_migration`, exacta
  a `04-DATABASE-SCHEMA-A.md` sección 4. RLS habilitada en la misma
  migración, sin políticas.
- **Archivos:** `packages/db/migrations/20260808160000_create_categories.sql`.
- **Resultado:** verificación OK por mecanismo: `relrowsecurity = true`,
  `policy_count = 0`.
- **Commit:** `feat(db): migración categories con RLS bloqueada`

### 2026-08-08 — paso 2.2 (migración brands)

- **Hecho:** aplicada `create_brands` vía `apply_migration`, exacta a
  `04-DATABASE-SCHEMA-A.md` sección 4. RLS habilitada, sin políticas.
- **Archivos:** `packages/db/migrations/20260808161000_create_brands.sql`.
- **Resultado:** verificación OK. `relrowsecurity = true`,
  `policy_count = 0`.
- **Commit:** `feat(db): migración brands con RLS bloqueada`

### 2026-08-08 — paso 2.3 (migración products + public_products)

- **Hecho:** aplicada `create_products` vía `apply_migration`:
  `product_type` (no existía todavía, pese a estar en el enum de
  `04-DATABASE-SCHEMA-A.md` sección 2 — la Fase 1 solo creó
  `user_role`/`company_member_role`), tabla `products` completa con
  sus 4 índices, RLS habilitada sin políticas, vista `public_products`
  (sin `price_cop`, sin RLS propia — su propiedad de `postgres` es lo
  que le permite servir de bypass controlado para `anon` en la Fase 3).
- **Archivos:** `packages/db/migrations/20260808162000_create_products.sql`.
- **Resultado:** verificación OK. `products`: `relrowsecurity = true`,
  `policy_count = 0`. `public_products`: columnas confirmadas sin
  `price_cop`.
- **Commit:** `feat(db): migración products + vista public_products`

### 2026-08-08 — paso 2.4 (migración product_images)

- **Hecho:** aplicada `create_product_images` vía `apply_migration`,
  exacta a `04-DATABASE-SCHEMA-A.md` sección 4. RLS habilitada, sin
  políticas.
- **Archivos:** `packages/db/migrations/20260808163000_create_product_images.sql`.
- **Resultado:** verificación OK. `relrowsecurity = true`,
  `policy_count = 0`.
- **Commit:** `feat(db): migración product_images con RLS bloqueada`

### 2026-08-08 — paso 2.5 (migración attribute_definitions + product_attributes)

- **Hecho:** aplicada `create_attribute_definitions_and_product_attributes`
  vía `apply_migration`, exacta a `04-DATABASE-SCHEMA-A.md` sección 4.
  RLS habilitada en ambas tablas, sin políticas.
- **Archivos:**
  `packages/db/migrations/20260808164000_create_attribute_definitions_and_product_attributes.sql`.
- **Resultado:** verificación OK. Ambas: `relrowsecurity = true`,
  `policy_count = 0`.
- **Commit:** `feat(db): migración attribute_definitions y product_attributes con RLS bloqueada`

### 2026-08-08 — paso 2.6 (migración product_documents)

- **Hecho:** aplicada `create_product_documents` vía `apply_migration`,
  exacta a `04-DATABASE-SCHEMA-A.md` sección 4. RLS habilitada, sin
  políticas — y sin políticas hasta postventa (nota ya dejada en
  `05-RLS-SECURITY.md` en el paso 1.2).
- **Archivos:** `packages/db/migrations/20260808165000_create_product_documents.sql`.
- **Resultado:** verificación OK. `relrowsecurity = true`,
  `policy_count = 0`. Cierra la Fase 2 de la tarea (esquema completo).
- **Commit:** `feat(db): migración product_documents con RLS bloqueada`

### 2026-08-08 — paso 2.7 (get_advisors de cierre de Fase 2)

- **Hecho:** corrido `get_advisors` (tipo `security`) tras el esquema
  completo. Resultado inicial: 8 INFO `rls_enabled_no_policy`
  (esperado, se cierran en Fase 3, `settings` queda fuera por decisión
  ya tomada en la Fase 1), 1 ERROR nuevo (`public_products` marcada
  `security_definer_view`) y 3 WARN (2 ya justificados en la Fase 1 +
  1 nuevo: `handle_new_user()` ejecutable vía RPC público).
  **`public_products` — justificado, no corregido:** es el diseño
  intencional de `05-RLS-SECURITY.md` sección 3. Una vista sin
  `security_invoker = true` corre con los privilegios de quien la
  creó (`postgres`), no de quien consulta — es exactamente lo que
  permite que `anon` la lea sin tener política en `products`. Ponerle
  `security_invoker = true` la dejaría devolviendo siempre 0 filas
  para `anon`. Justificación agregada por escrito en el propio doc,
  junto a la definición de la vista.
  **`handle_new_user()` — corregido:** hallazgo real, no se detectó al
  crear la función en la Fase 1 (paso 6.1) porque esa fase no tuvo un
  `get_advisors` posterior a ese paso específico. Revocado `execute`
  de `public`/`anon`/`authenticated` — no afecta el disparador
  (verificado con una inserción de prueba real en `auth.users`: el
  trigger crea el perfil igual, `security definer` no depende del
  permiso de la sesión).
  Re-corrido `get_advisors`: quedan los 8 INFO esperados, los 2 WARN
  de la Fase 1 y el ERROR justificado de `public_products`. Nada
  nuevo sin explicar.
- **Archivos:**
  `packages/db/migrations/20260808166000_revoke_handle_new_user_public_execute.sql`,
  `docs/05-RLS-SECURITY.md`.
- **Resultado:** verificación OK. Cierra la Fase 2 de la tarea
  completa.
- **Commit:** `fix(db): revoca execute público de handle_new_user, justifica public_products`

### 2026-08-08 — paso 3.1 (políticas RLS de categories/brands)

- **Hecho:** aplicadas `categories_read_public`/`categories_write_master`
  y `brands_read_public`/`brands_write_master`, exactas al patrón
  "Contenido público" de `05-RLS-SECURITY.md`. Prueba de aislamiento
  real: por primera vez se pudo usar `set local role anon` directo
  (a diferencia de `supabase_auth_admin`, que Postgres bloquea incluso
  para `service_role` — visto en la Fase 1 paso 7.2) — verificación
  más fuerte que el JWT simulado. Asserts: (1) `anon` ve solo
  categorías/marcas `is_active = true`, no las inactivas; (2) `anon`
  no puede actualizar (0 filas); (3) con usuarios reales y JWT
  simulado, un `customer` tampoco puede escribir, un `master` sí. Sin
  excepción en ningún bloque, cleanup confirmado (`0` residuos en las
  tres tablas de prueba).
- **Archivos:**
  `packages/db/migrations/20260808170000_categories_brands_rls_policies.sql`.
- **Resultado:** verificación OK. Sin residuos de prueba.
- **Commit:** `feat(db): políticas RLS de categories y brands con prueba real de anon`

### 2026-08-08 — paso 3.2 (políticas RLS de products + grant de public_products)

- **Hecho:** aplicadas `products_read_authenticated`,
  `products_write_master`, y `grant select on public_products to
  anon, authenticated` (sin el grant, la vista no es alcanzable pese
  a bypassar RLS internamente). Prueba con `set local role anon`
  real: no ve `products` directo (0 filas), sí ve `public_products`
  (1 fila). Con usuario `customer` autenticado real: ve `price_cop` al
  consultar `products` directo — **esperado**, RLS restringe filas, no
  columnas; la protección real de que un anónimo no vea precio es de
  dos capas (RLS bloquea `anon` en `products` por completo + en la
  Fase 5 `resolvePrice()` nunca expone `price_cop` a la UI sin
  sesión). `customer` no puede escribir (0 filas), `master` sí (1
  fila). Sin excepción en ningún bloque, cleanup confirmado.
- **Archivos:**
  `packages/db/migrations/20260808171000_products_rls_policies.sql`.
- **Resultado:** verificación OK. Sin residuos de prueba.
- **Commit:** `feat(db): políticas RLS de products + grant de public_products a anon`

### 2026-08-08 — paso 3.3 (políticas RLS de product_images/attribute_definitions/product_attributes)

- **Hecho:** aplicadas las 6 políticas (lectura pública vía
  `public_products`, escritura `master`). Prueba con `set local role
  anon` real: un producto activo y uno inactivo, cada uno con su
  imagen; una definición de atributo de la categoría; un valor de
  atributo del producto activo. Asserts: `anon` ve solo la imagen del
  producto activo (no la del inactivo), ve la definición de atributo
  (la categoría tiene al menos un producto activo), ve el valor de
  atributo del producto activo, no puede escribir ninguna de las tres
  tablas. Sin excepción, cleanup confirmado.
- **Archivos:**
  `packages/db/migrations/20260808172000_product_images_attributes_rls_policies.sql`.
- **Resultado:** verificación OK. Sin residuos de prueba. Fase 3 de la
  tarea cerrada — falta solo 3.4 (`product_documents`, ya sin
  políticas por diseño) y 3.5 (`get_advisors` de cierre).
- **Commit:** `feat(db): políticas RLS de product_images, attribute_definitions y product_attributes`

### 2026-08-08 — paso 3.4 (confirmación: product_documents sin políticas)

- **Hecho:** sin SQL nueva — el porqué ya quedó documentado en 1.2/2.6
  (`05-RLS-SECURITY.md`, depende de `owned_equipment` que no existe
  hasta postventa). Verificación por mecanismo: `relrowsecurity =
  true`, `policy_count = 0`. Verificación con datos reales de prueba
  (no tabla vacía): un documento con `is_public = true` sigue
  invisible tanto para `anon` como para `authenticated` — bloqueada de
  verdad, no por falta de datos.
- **Archivos:** ninguno (sin cambios de esquema).
- **Resultado:** verificación OK. Sin residuos de prueba.
- **Commit:** N/A (sin cambios de archivo, solo bitácora)

### 2026-08-08 — paso 3.5 (get_advisors de cierre de Fase 3)

- **Hecho:** corrido `get_advisors` (tipo `security`) tras abrir todas
  las políticas del catálogo. Resultado: 2 INFO esperados
  (`product_documents` — por diseño, `settings` — decisión de la Fase
  1), el ERROR de `public_products` ya justificado por escrito en el
  paso 2.7, los 2 WARN de `auth_role`/`auth_company_ids` ya
  justificados en la Fase 1. Nada nuevo sin explicar.
- **Archivos:** ninguno (paso de solo lectura).
- **Resultado:** verificación OK. **Cierra la Fase 3 de la tarea** —
  todas las políticas RLS del catálogo abiertas y probadas con `anon`
  real.
- **Commit:** N/A (sin cambios de archivo, solo bitácora)

## Bloqueos

- **Home (paso 6.1):** requiere que el usuario genere la pantalla en
  Stitch — no puedo generarla yo. Bloquea 6.2/6.3 hasta que exista el
  export en `design/stitch/home/`.
- **Inventario real:** sigue bloqueante en `progress/TODO.md`. Esta
  tarea usa datos de prueba, no bloquea el resto.

## Pendientes descubiertos

(se completa según aparezcan)
