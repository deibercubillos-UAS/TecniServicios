# TAREA: Fase 2 — Catálogo público (parte B: bitácora, bloqueos, pendientes)

**Completada 2026-08-08.**

Parte A (plan): [`DONE-fase-2-catalogo-publico-A.md`](./DONE-fase-2-catalogo-publico-A.md)

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

### 2026-08-08 — paso 4.1 (prueba real: el precio nunca llega a anon)

- **Hecho:** `packages/db/tests/rls/catalog.test.ts` (vitest,
  `@supabase/supabase-js` real, mismo patrón que `companies.test.ts`/
  `company_members.test.ts` de la Fase 1). Tres pruebas: (1) `anon`
  consulta `public_products` — la fila no trae la clave `price_cop`
  en absoluto, ni el monto aparece en el JSON serializado; (2) `anon`
  no puede leer `products` directo aunque pida explícitamente
  `price_cop`; (3) un `customer` con sesión real sí ve el precio en
  `products`. **Alcance de esta prueba:** valida el contrato de datos
  (`public_products`) del que van a depender las páginas reales — no
  hay ninguna página de listado/ficha todavía (Fase 7), así que la
  verificación de "ver código fuente" del criterio de "listo" del
  roadmap se hace ahí, sobre HTML real, no acá.
- **Verificación:** `pnpm --filter @tecni/db typecheck`/`lint`
  verdes. No pude correr el test localmente (sin `service_role` en
  este entorno, misma limitación de la Fase 1) — se confirma en verde
  con el próximo push, vía `rls-tests` de CI.
- **Archivos:** `packages/db/tests/rls/catalog.test.ts`.
- **Resultado:** verificación OK. Los 4 jobs de CI en verde
  (`run_id 31272421144`), `rls-tests` incluido con las 3 pruebas
  nuevas.
- **Commit:** `feat(db): prueba real de que el precio nunca llega a un anónimo`

### 2026-08-08 — paso 4.2 (ya sumado a CI automáticamente)

- **Hecho:** el job `rls-tests` de `ci.yml` corre `pnpm --filter
  @tecni/db test`, que ejecuta todo `vitest` encuentre bajo
  `tests/rls/` — `catalog.test.ts` ya corrió junto con
  `companies.test.ts`/`company_members.test.ts` en el verde del paso
  4.1 (`run_id 31272421144`), sin necesidad de tocar `ci.yml`. Cierra
  la Fase 4 de la tarea.
- **Archivos:** ninguno.
- **Resultado:** verificación OK (ya confirmada en 4.1).
- **Commit:** N/A (sin cambios de archivo, solo bitácora)

### 2026-08-08 — paso 5.1 (SiigoMockClient)

- **Hecho:** `packages/integrations/src/siigo/{types.ts,mock-client.ts}`
  — `SiigoClient` (interfaz que tendrá el cliente real:
  `getProductPrice`, `getProductStock`), `SiigoMockClient` la
  implementa con hash FNV-1a determinístico por `sku` (sin red, sin
  estado compartido, mismo SKU siempre da el mismo precio/stock).
  Precio entre $50.000 y $50.000.000 COP, IVA 19% fijo. `sku` vacío →
  `null`/`unknown`. Agregado `vitest` al paquete (no lo tenía) con 4
  pruebas unit reales: determinismo, SKUs distintos dan precios
  distintos, rango y IVA correctos, caso `sku` vacío.
- **Archivos:** `packages/integrations/package.json`,
  `packages/integrations/vitest.config.ts`,
  `packages/integrations/src/siigo/types.ts`,
  `packages/integrations/src/siigo/mock-client.ts`,
  `packages/integrations/src/siigo/mock-client.test.ts`,
  `packages/integrations/src/index.ts`, `pnpm-lock.yaml`.
- **Resultado:** verificación OK. `typecheck`/`lint`/`test` verdes en
  el paquete; `pnpm typecheck`/`pnpm lint` en la raíz también, sin
  romper nada del resto del monorepo.
- **Commit:** `feat(integrations): SiigoMockClient determinístico por sku`

### 2026-08-08 — paso 5.1 (job unit-tests en CI)

- **Hecho:** `ci.yml` no corría estas pruebas (solo
  `lint`/`typecheck`/`build`/`rls-tests`). Como no necesitan secretos,
  se agregó el job `unit-tests` (`pnpm --filter @tecni/integrations
  test`). `18-TESTING.md` sección 3 actualizada.
- **Archivos:** `.github/workflows/ci.yml`, `docs/18-TESTING.md`.
- **Resultado:** verificación OK. Los 5 jobs de CI en verde
  (`run_id 31272679400`), `unit-tests` incluido.
- **Commit:** `ci(unit-tests): corre las pruebas de packages/integrations`

### 2026-08-08 — paso 5.2 (resolvePrice)

- **Hecho:** `packages/core/src/catalog/resolve-price.ts` —
  `resolvePrice(product, ctx)`. `ctx.userId` nulo → siempre oculto
  (segunda capa de defensa, RLS ya bloquea el dato a nivel de base).
  Con sesión, antigüedad del precio según `08-INTEGRATION-SIIGO.md`
  sección 2: `< 6h` confirmado, `6–48h` `unconfirmed` ("sujeto a
  confirmación"), `> 48h` oculto. Sin `price_cop` o sin
  `price_synced_at` → oculto aunque haya sesión. Tipos desacoplados
  de la forma de la fila de Postgres (`ResolvePriceProduct` en
  camelCase) — quien llame mapea desde el resultado de la consulta,
  `packages/core` no sabe de `snake_case` ni de Supabase. 7 pruebas
  unit reales, incluidos los límites exactos de 6h/48h. Agregado
  `vitest` a `packages/core` (no lo tenía) y sumado
  `pnpm --filter @tecni/core test` al job `unit-tests` de CI.
- **Archivos:** `packages/core/src/catalog/resolve-price.ts`,
  `packages/core/src/catalog/resolve-price.test.ts`,
  `packages/core/src/index.ts`, `packages/core/package.json`,
  `packages/core/vitest.config.ts`, `.github/workflows/ci.yml`,
  `pnpm-lock.yaml`.
- **Resultado:** verificación OK. `typecheck`/`lint`/`test` verdes en
  el paquete (7/7); `pnpm typecheck`/`pnpm lint` en la raíz también.
  Los 5 jobs de CI en verde (`run_id 31272878487`). **Cierra la Fase 5
  de la tarea.**
- **Commit:** `feat(core): resolvePrice, la única fuente de precio para la UI`

## Bloqueos

- ~~Home (paso 6.1)~~ — **resuelto 2026-08-08.** El usuario exportó el
  Home (y de paso otras 7 pantallas más, útiles para fases futuras) a
  `design/stitch/`.
- **Inventario real:** sigue bloqueante en `progress/TODO.md`. Esta
  tarea usa datos de prueba, no bloquea el resto.

## Pendientes descubiertos

- **Cifras de la franja de estadísticas** ("15+ años", "500+ talleres",
  "10k+ referencias", "24/7 soporte") de `design/stitch/home/code.html`:
  sin fuente real, no se reconstruyen con esos números en el paso 6.3.
  El usuario debe confirmar las cifras reales (o decidir omitir la
  sección) antes de publicarla.
- `design/stitch/` ya tiene 7 pantallas más exportadas (Login, Registro,
  Calendario, carrito, carrito flotante, catalogo, Comparador, ficha de
  producto) — no pedidas explícitamente en el plan de esta tarea, pero
  quedan disponibles para cuando toque construir esas pantallas
  (algunas en esta misma Fase 2 — catálogo, ficha, comparador —, otras
  en Fase 3 — carrito).

### 2026-08-08 — paso 6.1 (Home exportado de Stitch)

- **Hecho:** el usuario generó y exportó el Home a
  `design/stitch/home/` (`code.html`, `DESIGN.md`, `screen.png`), junto
  con 7 pantallas adicionales no pedidas en el plan (quedan anotadas
  como pendiente descubierto para fases futuras).
- **Archivos:** ninguno (contenido en `design/`, fuera del build, ver
  `17-STITCH-MIGRATION.md` sección 2 paso 2).
- **Resultado:** verificación OK — el export existe con la estructura
  esperada.
- **Commit:** N/A (archivos entregados por el usuario, no generados en
  esta sesión)

### 2026-08-08 — paso 6.2 (auditar, tokenizar, extraer componentes)

- **Hecho:** auditado `design/stitch/home/code.html` contra
  `02-DESIGN-SYSTEM.md`. Extraídos 8 componentes a `packages/ui`
  (`Icon`, `Button`, `Badge`, `StatItem`, `FeatureCard`,
  `AudienceCard`, `CategoryChip`, `TrustItem`), documentados en
  `docs/03-UI-COMPONENTS.md` (nuevo). Decisiones de la auditoría:
  - **Tipografía:** Stitch generó con Oswald + Hanken Grotesk (Google
    Fonts) — descartadas, el proyecto usa Montserrat únicamente, ya
    cargada desde la Fase 0.
  - **Íconos:** Material Symbols de Google Fonts (dependencia externa)
    reemplazados por `Icon`, un set mínimo de ~20 SVG en línea, los
    únicos que usa la home real.
  - **Colores:** paleta de Stitch (aproximación de IA) mapeada a los
    tokens reales del proyecto — ningún hex de Stitch sobrevivió.
  - **Fotos de stock:** las URLs de `lh3.googleusercontent.com`
    (temporales de la generación) se retiraron. Entre ellas había tres
    "fotos de clientes" (banco de imágenes genérico) presentadas junto
    a "+500 talleres confían en nosotros" y 4.5 estrellas — contenido
    fabricado sin respaldo real, no se reconstruye así. `AudienceCard`
    usa un fondo degradado con tokens de marca en vez de foto.
  - **Cifras inventadas** de la franja de estadísticas: anotadas como
    pendiente descubierto, no se reconstruyen con esos números.
  Configurado `packages/ui` para JSX (`react`, `@types/react`,
  `jsx: "react-jsx"` en su `tsconfig.json` — primer paquete del
  monorepo con `.tsx`) y agregado `@source` en
  `apps/web/app/globals.css` (Tailwind v4 no escanea automáticamente
  clases fuera de `apps/web`, sin eso las clases usadas en
  `packages/ui` nunca se generan).
- **Archivos:** `packages/ui/package.json`, `packages/ui/tsconfig.json`,
  `packages/ui/src/{index.ts,icon.tsx,button.tsx,badge.tsx,
  stat-item.tsx,feature-card.tsx,audience-card.tsx,category-chip.tsx,
  trust-item.tsx}`, `apps/web/app/globals.css`,
  `docs/03-UI-COMPONENTS.md` (nuevo), `docs/00-INDEX.md` (estado 03 →
  ✅), `pnpm-lock.yaml`.
- **Resultado:** verificación OK. `pnpm typecheck`/`pnpm lint` verdes
  en los 8 paquetes.
- **Commit:** `feat(ui): extrae componentes de la home migrada de Stitch`

### 2026-08-08 — paso 6.3 (reconstruir home en Next.js)

- **Hecho:** `apps/web/app/(public)/page.tsx` reconstruida con los 8
  componentes de `packages/ui`: hero, franja de confianza, franja de
  estadísticas (placeholder visible — decisión del usuario vía
  `AskUserQuestion`: valores `"—"` con `TODO(2026-08-08)` fechado en el
  código, no se publica a producción sin reemplazarlas), propuesta de
  valor, selector de audiencia, vista previa de categorías (con las
  categorías reales del negocio — alineación, balanceo, elevación,
  diagnóstico, lubricación, insumos — no las genéricas de Stitch).
  **Hallazgo durante la verificación:** `Button` (de `packages/ui`) no
  tenía prop `asChild` y siempre renderiza un `<button>` nativo — la
  primera versión de esta página anidaba un `<Link>` (`<a>`) dentro,
  HTML inválido (interactivo dentro de interactivo) y error de
  TypeScript (`asChild` no existe en `ButtonProps`). Corregido
  agregando `LinkButton` (ancla con las mismas clases) y `buttonClass(
  variant)` — un helper que expone las clases del botón para usarlas
  directo en `next/link`'s `<Link>` y conservar la navegación de
  cliente (un `<a>` nativo no la tiene). La home usa `buttonClass` con
  `Link`, no `LinkButton`, para no perder esa navegación de cliente.
  **Segundo hallazgo:** `apps/web/package.json` nunca declaró
  `@tecni/ui` como dependencia (se creó el paquete a mitad de la Fase 2
  sin agregarlo) — `tsc` fallaba con `Cannot find module '@tecni/ui'`.
  Agregada la dependencia `workspace:*` y corrido `pnpm install`.
- **Verificación:** `pnpm typecheck`/`pnpm lint` verdes en los 8
  paquetes. `pnpm --filter web build` verde (con env dummy local, la
  página `/` prerenderiza estática, 106 kB First Load JS). Servidor
  local (`next start`) responde `200` en `/`. HTML real inspeccionado
  con `curl`: los 3 CTAs de la home son `<a href=...>` con las clases
  de variante correctas, sin ningún `<a>` anidado dentro de `<button>`
  — solo queda 1 `<button>` real en toda la página (el toggle de menú,
  no tocado en este paso). No se pudo hacer captura visual con
  Playwright (no está instalado en el repo) — verificación de
  contraste/foco/responsive queda por HTML/clases de Tailwind (mismos
  tokens ya auditados en 6.2), no por captura de pantalla.
- **Archivos:** `apps/web/app/(public)/page.tsx`,
  `apps/web/package.json`, `packages/ui/src/button.tsx`,
  `packages/ui/src/index.ts`, `pnpm-lock.yaml`.
- **Resultado:** verificación OK. **Cierra el paso 6.3** — Home
  reconstruida y publicable (con la franja de estadísticas en
  placeholder marcado). Falta Fase 7 (listado/búsqueda/ficha/
  comparador) y Fase 8 (contacto, SEO, cierre) de la tarea.
- **Commit:** `feat(web): reconstruye la home migrada de Stitch con packages/ui`

Continúa en [`DONE-fase-2-catalogo-publico-C.md`](./DONE-fase-2-catalogo-publico-C.md) — pasos 7.1 en adelante.
