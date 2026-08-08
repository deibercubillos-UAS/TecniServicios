# TAREA: Fase 2 — Catálogo público (parte C: bitácora, pasos 7.1–8.3)

**Completada 2026-08-08.**

Continúa de [`DONE-fase-2-catalogo-publico-B.md`](./DONE-fase-2-catalogo-publico-B.md) —
plan completo en [`DONE-fase-2-catalogo-publico-A.md`](./DONE-fase-2-catalogo-publico-A.md).

## Bitácora (continuación)

### 2026-08-08 — paso 7.1 (listado con filtros)

- **Hecho:** `apps/web/app/(public)/catalogo/page.tsx` — server component
  que lee `categories`/`brands` activas, filtra `public_products` por
  categoría (incluye subcategorías de un nivel, `parent_id`), marca y
  atributos filtrables de la categoría activa (`attribute_definitions
  .is_filterable = true`: `enum` como checkboxes vía `product_attributes
  .value_text`, `number` como rango min/máx vía `value_number`).
  Paginación **keyset** sobre `(orden, id)` — nunca offset, regla de
  `12-MODULE-CATALOG.md` sección 4 — codificada en un cursor opaco
  (`apps/web/app/(public)/catalogo/cursor.ts`, base64url de
  `{value, id}`). Orden restringido a `nombre`/`más nuevos` — **nunca
  precio**, ni siquiera con sesión (revelaría el precio indirectamente);
  `relevancia` reservado para 7.2 (aún no aplica sin búsqueda activa).
  Regla encapsulada en `packages/core` (`getAllowedCatalogSorts`,
  `isCatalogSortAllowed`) para que no dependa de que la UI la respete
  por las buenas — 6 pruebas unit reales.
  **Hallazgo:** `public_products` no exponía `created_at`, necesario
  para "más nuevos" — no es dato sensible, se agregó a la vista
  (`packages/db/migrations/20260808180000_add_created_at_to_public_products.sql`,
  `get_advisors` re-corrido: mismos hallazgos ya justificados, nada
  nuevo).
  Precio: nunca se lee `product.price_cop` directo — se consulta
  `products` (no la vista) solo si hay sesión, y siempre pasa por
  `resolvePrice()` antes de llegar a `ProductCard`
  (`packages/ui/src/product-card.tsx`, nuevo). Formato de moneda nuevo
  y aislado en `packages/shared` (`formatCop`, agregado `vitest` al
  paquete — no lo tenía — con 2 pruebas, sumado al job `unit-tests` de
  CI).
  Ficha de producto (`/catalogo/[slug]`) enlazada desde cada
  `ProductCard` pero **no existe todavía** — se construye en el paso
  7.3; hasta entonces el link da 404, aceptado como referencia hacia
  adelante (mismo patrón de construcción incremental de esta tarea).
- **Verificación:** `pnpm typecheck`/`pnpm lint` verdes en los 8
  paquetes. `pnpm --filter web build` verde (`/catalogo` dinámica, como
  corresponde — depende de sesión y `searchParams`). Servidor local
  responde `200` en `/catalogo` incluso con credenciales de Supabase
  inválidas localmente (degrada a "No hay productos", sin filtrar
  ningún error de base de datos al HTML — regla de `CLAUDE.md` sección
  7). Verificación real del **SQL equivalente** de los filtros vía
  `execute_sql` (proyecto no alcanzable por red desde este entorno,
  mismo límite ya conocido de la Fase 1): datos de prueba insertados
  dentro de una transacción con `rollback` al final (sin residuo,
  confirmado con un `count` posterior) — confirmado el filtro por
  categoría, la intersección del filtro de atributo `enum`, el cursor
  keyset (siguiente página después del primer nombre) y el orden por
  `created_at desc`, los cuatro con el resultado esperado.
- **Archivos:** `apps/web/app/(public)/catalogo/{page.tsx,cursor.ts}`,
  `packages/ui/src/{product-card.tsx,index.ts}`,
  `packages/core/src/catalog/{catalog-sort.ts,catalog-sort.test.ts}`,
  `packages/core/src/index.ts`,
  `packages/shared/src/{format-cop.ts,format-cop.test.ts,index.ts}`,
  `packages/shared/{package.json,vitest.config.ts}`,
  `packages/db/migrations/20260808180000_add_created_at_to_public_products.sql`,
  `docs/05-RLS-SECURITY.md`, `.github/workflows/ci.yml`,
  `pnpm-lock.yaml`.
- **Resultado:** verificación OK. **Cierra el paso 7.1.**
- **Commit:** `feat(web): listado de catálogo con filtros, paginación keyset y precio via resolvePrice`

### 2026-08-08 — fuera de plan: header global auditado desde Stitch

- **Hecho:** el usuario pidió verificar el header y dejarlo establecido
  como base para todas las páginas. `apps/web/components/site-header.tsx`
  (Fase 0, nunca auditado contra el export de Stitch) se reconstruyó
  con la estructura del navbar de `design/stitch/home/code.html`
  (sticky, logo, búsqueda centrada, nav + CTA a la derecha) — ya se
  aplicaba globalmente vía `apps/web/app/layout.tsx` desde la Fase 0,
  así que "establecerlo para todas las páginas" ya estaba resuelto por
  la arquitectura; lo que faltaba era auditarlo.
  **Contenido fabricado descartado** (mismo criterio que 6.2): los menús
  desplegables Productos/Servicios/Marcas (sin submenú real detrás), el
  ícono de favoritos (módulo no existe) y el carrito con contador fijo
  "3" (commerce es Fase 3, no construido). Nav real: solo Catálogo y
  Contacto, rutas que existen.
  CTA a la derecha ahora es consciente de la sesión real (consulta
  `auth.getUser()`, mismo patrón que las páginas de auth): sin sesión,
  "Iniciar sesión"; con sesión, muestra el correo (no hay página de
  cuenta ni acción de cerrar sesión construida todavía — pendiente, no
  bloquea esta tarea).
  Buscador conectado a `/catalogo?q=` — formulario GET real, pero
  **inerte hasta el paso 7.2** (la página de catálogo todavía no lee
  `q`, ahí se implementa la búsqueda de texto completo).
  **Efecto secundario detectado:** al consultar la sesión en el header
  (presente en cada página vía el layout raíz), Next.js dejó de poder
  prerenderizar la home como estática (`○` → `ƒ` en el build) — todas
  las páginas pasan a renderizarse por request. Es el costo esperado de
  un header consciente de sesión (mismo patrón de cualquier header con
  login real); no se intentó mitigar con `Suspense`/streaming por
  quedar fuera del pedido puntual — queda anotado como posible mejora
  de rendimiento futura, no como bug.
- **Verificación:** `pnpm typecheck`/`pnpm lint` verdes en los 8
  paquetes. `pnpm --filter web build` verde. Servidor local: `200` en
  `/` y `/catalogo`, HTML real confirma "Iniciar sesión"/"Catálogo"/
  "Contacto"/el placeholder de búsqueda presentes, sin `favorite`/
  `shopping_cart`/contadores fabricados.
- **Archivos:** `apps/web/components/site-header.tsx`.
- **Resultado:** verificación OK. No corresponde a un paso numerado del
  plan — registrado por pedido explícito del usuario fuera de
  secuencia.
- **Commit:** `refactor(web): audita el header global contra el navbar de Stitch`

### 2026-08-08 — paso 7.2 (búsqueda de texto completo)

- **Hecho:** `search_products(search_query text)` — función SQL
  (`packages/db/migrations/20260808190000_create_search_products_function.sql`)
  que lee de `public_products` (nunca `products`), filtra con
  `plainto_tsquery('spanish', ...)` sobre la misma expresión del índice
  `gin` ya existente, ordena por `ts_rank` descendente. `security
  invoker` (por defecto) — el acceso lo da el `grant select` que ya
  tiene la vista, no hace falta `security definer`.
  `apps/web/app/(public)/catalogo/page.tsx` conecta `?q=` (ya enviado
  por el buscador del header desde el paso anterior) a la función vía
  `supabase.rpc()`. Con búsqueda activa, el orden por defecto pasa a
  `relevancia` (antes `nombre`); `nombre`/`más nuevos` siguen
  disponibles y, si se eligen, intersectan los mismos ids que devolvió
  la búsqueda (mismo mecanismo ya usado para los filtros de atributos).
  El orden por relevancia pagina en memoria sobre el resultado ya
  ordenado por `rank` de la función (dataset acotado en esta fase, sin
  inventario real todavía — no se implementó keyset por `rank` en SQL
  por desproporcionado para el volumen actual, anotado como posible
  ajuste cuando haya inventario real).
- **Hallazgo:** `get_advisors` marcó la función nueva con
  `function_search_path_mutable` (WARN) — corregido con `search_path`
  explícito (`packages/db/migrations/20260808191000_fix_search_products_search_path.sql`).
  Re-corrido `get_advisors`: vuelve a la base ya conocida y justificada,
  nada nuevo.
- **Verificación:** `pnpm typecheck`/`pnpm lint` verdes en los 8
  paquetes. `pnpm --filter web build` verde. Verificación real de la
  función vía `execute_sql` (proyecto no alcanzable por red desde este
  entorno): datos de prueba insertados en una transacción con
  `rollback` al final (sin residuo, confirmado con `count` posterior) —
  `search_products('alineacion')` y `search_products('balanceo')`
  devuelven exactamente el producto esperado con `rank > 0`,
  `search_products('inexistente xyz')` devuelve vacío. Servidor local
  con credenciales dummy: `200` en `/catalogo?q=balanceo`, HTML muestra
  "Resultados para..."/"quitar búsqueda" sin filtrar ningún error al
  degradar (RPC falla con credenciales inválidas, la página cae a "No
  hay productos", no a un stack trace).
- **Archivos:**
  `packages/db/migrations/20260808{190000_create_search_products_function,191000_fix_search_products_search_path}.sql`,
  `apps/web/app/(public)/catalogo/page.tsx`, `docs/12-MODULE-CATALOG.md`.
- **Resultado:** verificación OK. **Cierra el paso 7.2.**
- **Commit:** `feat(db): búsqueda de texto completo del catálogo con search_products`

### 2026-08-08 — paso 7.3 (ficha de producto)

- **Hecho:** `apps/web/app/(public)/catalogo/[slug]/page.tsx` — busca el
  producto en `public_products` por `slug` (`maybeSingle`), `notFound()`
  si no existe. Trae categoría, marca, galería (`product_images`
  ordenadas por `position`, la `is_primary` primero como imagen
  principal), specs (`attribute_definitions` de la categoría +
  `product_attributes` del producto, solo las que tienen valor cargado
  — un producto sin todos sus atributos obligatorios igual se muestra,
  regla de `12-MODULE-CATALOG.md` sección 3). `generateMetadata` para
  el `<title>`/`description` reales por producto.
  **Precio:** nunca se lee `product.price_cop` directo — solo se
  consulta `products` (no la vista) si hay sesión, y siempre pasa por
  `resolvePrice()`. Sin sesión: "Inicia sesión para ver precios" (link
  a `/login`). Con sesión y precio oculto por antigüedad (`> 48h`):
  "Precio no disponible... Solicita una cotización" (el flujo real de
  solicitud es Fase 3/Commerce, no construido — mensaje sin CTA
  funcional todavía, no fabrica un botón que no hace nada).
  Manuales/fichas técnicas (`product_documents`) fuera de alcance —
  regla ya documentada en el paso 1.2, la tabla sigue sin políticas.
- **Verificación:** `pnpm typecheck`/`pnpm lint` verdes en los 8
  paquetes. `pnpm --filter web build` verde (ruta `/catalogo/[slug]`
  registrada). Servidor local: `404` real en un slug inexistente
  (`notFound()` funciona). Verificación real del join producto +
  specs vía `execute_sql` (proyecto no alcanzable por red desde este
  entorno): datos de prueba insertados en una transacción con
  `rollback` al final (sin residuo, confirmado con `count` posterior)
  — el join `products`/`product_attributes`/`attribute_definitions`
  devuelve exactamente la spec esperada (`Diámetro de rin: 17 in`).
- **Archivos:** `apps/web/app/(public)/catalogo/[slug]/page.tsx`.
- **Resultado:** verificación OK. **Cierra el paso 7.3.** Falta 7.4
  (comparador) para cerrar la Fase 7.
- **Commit:** `feat(web): ficha de producto con specs por categoría y precio vía resolvePrice`

### 2026-08-08 — paso 7.4 (comparador)

- **Hecho:** selección de comparación vive **solo en el cliente**
  (`localStorage`, `apps/web/lib/compare-list.ts`) — nunca persiste en
  la base, regla de `12-MODULE-CATALOG.md` sección 7. Límite duro de 3;
  agregar un producto de otra categoría reemplaza la selección completa
  (no tiene sentido comparar entre categorías).
  `CompareToggle` (`apps/web/components/compare-toggle.tsx`, cliente) —
  checkbox "Comparar" agregado en el listado y en la ficha, fuera del
  `<Link>` que navega al producto (`stopPropagation` en el `<label>`,
  no anida interactivo dentro de interactivo — mismo cuidado que el
  hallazgo de `Button`/`asChild` del paso 6.3).
  `CompareBar` (`apps/web/components/compare-bar.tsx`, cliente) — barra
  flotante que aparece con 2+ productos seleccionados, montada en
  `apps/web/app/layout.tsx` (visible en todo el sitio, no solo en
  catálogo/ficha).
  `/comparador?ids=a,b,c` — server component normal (los ids ya viajan
  en la URL, no hace falta fetch de cliente). Valida mínimo 2 productos,
  **misma categoría** (si no, mensaje explícito en vez de comparar cosas
  sin sentido), trae solo `attribute_definitions.is_comparable = true`
  de esa categoría, en orden de `position`. Sin precio — el doc de
  catálogo no lo pide en el comparador y evita reimplementar
  `resolvePrice` fuera del patrón ya establecido sin necesidad real.
- **Verificación:** `pnpm typecheck`/`pnpm lint` verdes en los 8
  paquetes. `pnpm --filter web build` verde (`/comparador` registrada).
  Servidor local: `200` en `/comparador` sin `ids` (mensaje "elige al
  menos 2 productos") y con `ids` inválidos (degrada igual, sin
  filtrar error de base de datos). Verificación real vía `execute_sql`
  (proyecto no alcanzable por red desde este entorno): datos de prueba
  con un atributo `is_comparable = true` y otro `= false` en una
  transacción con `rollback` al final (sin residuo, confirmado con
  `count` posterior) — la consulta equivalente del comparador solo trae
  el atributo comparable, el no comparable no aparece.
- **Archivos:** `apps/web/lib/compare-list.ts`,
  `apps/web/components/{compare-toggle.tsx,compare-bar.tsx}`,
  `apps/web/app/(public)/comparador/page.tsx`,
  `apps/web/app/(public)/catalogo/{page.tsx,[slug]/page.tsx}`,
  `apps/web/app/layout.tsx`.
- **Resultado:** verificación OK. **Cierra el paso 7.4 y la Fase 7
  completa** — listado, búsqueda, ficha y comparador construidos.
  Falta la Fase 8 (contacto, SEO, cierre) para terminar la tarea.
- **Commit:** `feat(web): comparador de productos (máx. 3, misma categoría, selección en cliente)`

### 2026-08-08 — paso 8.1 (página de contacto)

- **Hecho:** ningún doc del proyecto tiene teléfono, dirección ni
  horario reales de la empresa (`PENDIENTE-DECISIÓN` en `CLAUDE.md`
  sección 9) — no se fabricaron. En vez de una página estática con
  datos inventados, se construyó un **formulario real y funcional**:
  tabla nueva `contact_messages` (`docs/04-DATABASE-SCHEMA-B.md`
  sección 7, `docs/05-RLS-SECURITY.md`) — cualquiera escribe
  (`insert to anon, authenticated with check (true)`), nadie anónimo
  lee, solo `master` (para el futuro panel de triage, Fase 16, no
  construido todavía).
  `submitContactMessage(client, input, ctx)` en `packages/core`
  (mismo patrón que `registerUser` — recibe el cliente por parámetro,
  no abre su propia sesión, testeable sin Next). `contactSchema` en
  `packages/shared` (Zod, regla de `CLAUDE.md` sección 7: "todo input
  externo se valida"). `apps/web/app/(public)/contacto/{page.tsx,
  actions.ts}` sigue exactamente el patrón de `registro`/`recuperar`
  (Server Action, `redirect` con `error`/`sent` en la URL, nunca deja
  pasar el error crudo de Postgres al cliente).
- **Hallazgo de verificación:** al probar el insert como `anon` real
  (`set local role anon`) con `RETURNING id`, Postgres lo rechazó por
  RLS — no es un bug del insert en sí: `INSERT ... RETURNING` exige
  que la fila resultante también pase las políticas de `SELECT`, y
  `anon` no tiene ninguna (por diseño). Repetido sin `RETURNING`: el
  insert pasa limpio. El código real (`submitContactMessage`) nunca
  encadena `.select()` en el `.insert()`, así que supabase-js pide
  `Prefer: return=minimal` a PostgREST — sin `RETURNING`, sin este
  problema. Quedó documentado acá para que nadie agregue `.select()`
  a ese insert sin darse cuenta de la implicación de RLS.
- **Verificación:** `pnpm typecheck`/`pnpm lint` verdes en los 8
  paquetes. `pnpm --filter web build` verde (`/contacto` registrada).
  `get_advisors` re-corrido tras la migración: misma base ya conocida,
  nada nuevo. Verificación real del insert como `anon` vía
  `execute_sql` (proyecto no alcanzable por red desde este entorno):
  con `RETURNING`, RLS lo bloquea (esperado, ver hallazgo); sin
  `RETURNING`, el insert pasa y un `select` posterior como `anon`
  devuelve `0` filas (tampoco puede leer lo que escribió — por
  diseño). Todo dentro de una transacción con `rollback`, sin residuo.
  Servidor local: `200` en `/contacto`, formulario real en el HTML.
- **Archivos:** `packages/db/migrations/20260808200000_create_contact_messages.sql`,
  `docs/04-DATABASE-SCHEMA-B.md`, `docs/05-RLS-SECURITY.md`,
  `packages/shared/src/schemas/contact.ts`,
  `packages/shared/src/index.ts`,
  `packages/core/src/content/submit-contact-message.ts`,
  `packages/core/src/index.ts`, `packages/core/package.json`,
  `apps/web/app/(public)/contacto/{page.tsx,actions.ts}`,
  `pnpm-lock.yaml`.
- **Resultado:** verificación OK. **Cierra el paso 8.1.**
- **Commit:** `feat(web): página de contacto con formulario real (contact_messages)`

### 2026-08-08 — paso 8.2 (SEO: metadatos, sitemap, JSON-LD sin precios)

- **Hecho:** metadatos por página ya existían desde los pasos
  anteriores (`title`/`description` reales en home vía `layout.tsx`,
  catálogo, ficha con `generateMetadata` por producto, comparador,
  contacto) — nada que agregar ahí. `apps/web/app/sitemap.ts` (Next.js
  App Router, `MetadataRoute.Sitemap`) — home, `/catalogo`, `/contacto`
  y una entrada por cada `public_products.slug` (nunca `products`
  directo, mismo patrón de todo el catálogo). `apps/web/app/robots.ts`
  — permite todo salvo las rutas protegidas por rol
  (`/mi-cuenta`/`/ventas`/`/tecnico`/`/admin`/`/api/`), que de todos
  modos nunca son alcanzables sin sesión.
  `NEXT_PUBLIC_SITE_URL` sigue `PENDIENTE-DECISIÓN` (dominio definitivo,
  `docs/19-DEPLOYMENT.md`) — el sitemap/robots caen a
  `http://localhost:3000` documentado en el propio código, en vez de
  fabricar un dominio real que todavía no existe.
  JSON-LD `schema.org/Product` agregado a la ficha (`[slug]/page.tsx`)
  — **sin bloque `offers`**, ni con sesión: un rastreador siempre lo ve
  como anónimo, así que el precio nunca puede entrar ahí (regla de
  `12-MODULE-CATALOG.md` sección 9). Serializado con `JSON.stringify`
  y `<` escapado a `<` para que no se pueda cerrar el `<script>`
  con datos del producto.
- **Verificación:** `pnpm typecheck`/`pnpm lint` verdes en los 8
  paquetes. `pnpm --filter web build` verde — `/sitemap.xml` y
  `/robots.txt` prerenderizan estáticos. Servidor local: XML/texto
  reales verificados con `curl` (URLs de home/catálogo/contacto,
  reglas `Disallow` de las rutas protegidas, referencia al sitemap).
  "Ver código fuente" del criterio de "listo" del roadmap: inspeccionado
  el objeto `productJsonLd` en el código — no referencia `price_cop` ni
  `resolvePrice()` en ningún punto, no hay forma de que el precio
  llegue ahí ni con sesión activa.
- **Archivos:** `apps/web/app/{sitemap.ts,robots.ts}`,
  `apps/web/app/(public)/catalogo/[slug]/page.tsx`.
- **Resultado:** verificación OK. **Cierra el paso 8.2.** Falta 8.3
  (cierre de la tarea completa).
- **Commit:** `feat(web): sitemap, robots.txt y JSON-LD de producto sin precio`

### 2026-08-08 — paso 8.3 (cierre de la tarea)

**Checklist de `05-RLS-SECURITY.md` sección 9:**
- [x] ¿Toda tabla nueva tiene `enable row level security`? Sí — `categories`,
  `brands`, `products`, `product_images`, `attribute_definitions`,
  `product_attributes`, `product_documents`, `contact_messages`.
- [x] ¿Probé la consulta como anónimo, como cliente de otra empresa y como
  rol inferior? Anónimo: sí, con `set local role anon` real en cada
  tabla (pasos 3.1–3.3) y en `contact_messages` (8.1). Cliente de otra
  empresa: **no aplica** — el catálogo es contenido global, no
  particionado por empresa (esa partición empieza en Fase 3/Commerce
  con `company_id`); no hay ninguna tabla nueva de esta fase con una
  columna de empresa. Rol inferior: no aplica todavía — esta fase solo
  distingue anónimo/autenticado (el precio), no hay diferencias por rol
  dentro de `customer`/`seller`/`technician`/`master` en el catálogo
  (eso empieza cuando existan paneles por rol, Fase 3+).
- [x] ¿Algún endpoint nuevo devuelve precios sin validar sesión? No —
  verificado en cada paso: `public_products` nunca tiene `price_cop`,
  `search_products` lee de esa vista, la ficha/listado consultan
  `products` directo solo si hay sesión, siempre a través de
  `resolvePrice()`. El sitemap y el JSON-LD tampoco lo referencian en
  ningún punto del código.
- [x] ¿Validé la entrada con Zod? El formulario de contacto sí
  (`contactSchema`). Los filtros del catálogo (categoría/marca/orden/
  atributos/búsqueda) viajan como parámetros de query hacia el cliente
  de Supabase (parametrizados por PostgREST, no SQL crudo) — **hallazgo
  real durante este mismo checklist:** el cursor de paginación sí
  concatenaba texto libre (nombre de producto) directo en un filtro
  `.or()` sin escapar. Corregido con `quoteFilterValue()` (citado según
  la sintaxis de PostgREST) antes de cerrar la tarea — ver commit de
  este paso.
- [x] ¿Hay algún `service_role` fuera del servidor? No — todas las
  consultas nuevas usan `createServerClient` (anon key + cookies) en
  Server Components/Actions, nunca `createServiceRoleClient` en esta
  fase.
- [x] ¿La operación quedó en `audit_log` si toca precio, rol, pedido o
  cotización? No aplica — esta fase es de solo lectura de catálogo
  (salvo `contact_messages`, que no es precio/rol/pedido/cotización).
- [x] ¿Algún error de base de datos llega crudo al cliente? No —
  verificado explícitamente con credenciales inválidas en cada página
  nueva (`/catalogo`, ficha, comparador, contacto): todas degradan a un
  mensaje genérico ("no hay productos", formulario con error genérico),
  nunca a un stack trace.
- [x] ¿Los archivos nuevos de R2 se sirven firmados? No aplica — sin R2
  todavía en esta fase (`product_images.url`/`product_documents` son
  placeholders de prueba, R2 real es `docs/11-STORAGE-R2.md`, sin
  empezar).

**Las tres preguntas de `CLAUDE.md` sección 8 paso 8:**
- **¿Qué ve un anónimo?** Catálogo completo (nombre, marca, categoría,
  imágenes, specs), nunca un precio ni en HTML ni en JSON-LD ni en el
  sitemap. CTA "Inicia sesión para ver precios". Puede enviar el
  formulario de contacto sin sesión.
- **¿Qué ve otra empresa?** No aplica a esta fase — el catálogo no
  tiene datos por empresa. Empieza a aplicar en Fase 3 (cotizaciones,
  pedidos), ya con el patrón de aislamiento probado en Fase 1.
- **¿Qué ve un rol inferior?** Mismo catálogo que cualquier
  autenticado — el precio depende de tener sesión, no del rol. Ningún
  rol ve algo que otro rol autenticado no vea, dentro de esta fase.

**Hecho además del checklist:** actualizados `docs/21-ROADMAP.md`
(Fase 1 y Fase 2 → ✅ Listo), `docs/progress/TODO.md` (sección "Fase 2
— código completo", `03-MODULE-CATALOG.md`/`12-MODULE-CATALOG.md`
marcados, nuevo pendiente de las cifras reales del home) y
`docs/progress/CHANGELOG.md` (entrada `2026-08-08 — Fase 2: catálogo
público`, incluye el hallazgo del cursor sin escapar).
- **Verificación:** `pnpm typecheck`/`pnpm lint` verdes en los 8
  paquetes tras el fix del cursor. `pnpm --filter web build` verde.
  Ningún `.md` tocado pasó de 500 líneas.
- **Archivos:** `apps/web/app/(public)/catalogo/{page.tsx,cursor.ts}`,
  `docs/21-ROADMAP.md`, `docs/progress/{TODO.md,CHANGELOG.md}`.
- **Resultado:** verificación OK. **Cierra el paso 8.3 y la Fase 2
  completa.** La tarea se mueve a `tasks/done/`.
- **Commit:** `fix(web): escapa el cursor de paginación en el filtro de PostgREST; cierra Fase 2`
