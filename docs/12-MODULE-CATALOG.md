# 12 — Módulo Catálogo

Volver a [`00-INDEX.md`](./00-INDEX.md) · Esquema en [`04-DATABASE-SCHEMA-A.md`](./04-DATABASE-SCHEMA-A.md) sección 4 · RLS en [`05-RLS-SECURITY.md`](./05-RLS-SECURITY.md) · Sincronización de precios en [`08-INTEGRATION-SIIGO.md`](./08-INTEGRATION-SIIGO.md)

---

## 1. Alcance

Catálogo navegable sin precios para anónimos: categorías, marcas, productos con
especificaciones por categoría, listado con filtros, búsqueda, ficha, comparador
(máximo 3). El precio y la compra son del módulo de comercio (`13-MODULE-COMMERCE.md`,
Fase 3) — este documento no repite el contrato de sincronización de precios ni el
umbral de cotización, ver `08-INTEGRATION-SIIGO.md`.

**No entra acá:** carrito, checkout, cotizaciones, pedidos, manuales privados de
equipos comprados (postventa).

---

## 2. Categorías y marcas

Jerarquía de categorías vía `parent_id` (una categoría puede tener subcategorías,
sin límite de profundidad declarado — en la práctica dos niveles: familia →
categoría). El **master** las administra desde el panel; el listado y el filtro
las leen ya creadas.

`brands` es plana, sin jerarquía. `logo_url` se sirve desde R2 (público, no
requiere firma — es material de marketing).

Ambas tienen lectura pública (`anon` + `authenticated`) de filas `is_active =
true`, escritura solo `master` — ver `05-RLS-SECURITY.md`.

---

## 3. Especificaciones por categoría

Las especificaciones **no son comunes entre categorías** — una balanceadora se
compara por diámetro de rin, un escáner por protocolos soportados. Por eso:

- `attribute_definitions`: qué atributos existen para una categoría (`key`,
  `label`, `unit`, `data_type`, `is_filterable`, `is_comparable`).
- `product_attributes`: el valor de cada atributo para cada producto
  (`value_text`/`value_number`/`value_boolean` según `data_type`).

El **master** define los atributos al crear la categoría, antes de cargar
productos de esa categoría. Un producto sin sus atributos obligatorios cargados
no aparece en el comparador (pero sí en el listado — no bloquea la publicación).

---

## 4. Listado y filtros

- Filtro por categoría (con sus subcategorías, si las tiene) y por marca:
  filtros directos sobre `products.category_id`/`brand_id`.
- Filtro por atributo: solo los `attribute_definitions.is_filterable = true`
  de la categoría activa. Los de tipo `enum` (`options` en `jsonb`) se muestran
  como checkboxes; los `number` como rango.
- Orden: por relevancia (si hay búsqueda activa), por nombre, por más nuevos
  (`created_at`). **Nunca por precio** para un anónimo (revelaría el precio
  indirectamente vía el orden — se omite esa opción de orden si no hay sesión).
- Paginación: cursor-based sobre `id` o `created_at`, no offset (el catálogo va
  a crecer y offset se degrada).

---

## 5. Búsqueda de texto completo

Índice `gin (to_tsvector('spanish', name || ' ' || coalesce(short_description,'')))`
ya definido en el esquema (`04-DATABASE-SCHEMA-A.md` sección 4). Búsqueda simple
(`plainto_tsquery('spanish', query)`), sin sinónimos ni fuzzy matching en esta
fase — se evalúa agregar `pg_trgm` si la búsqueda exacta resulta insuficiente en
producción.

Expuesta como la función `search_products(search_query text)` (`security invoker`,
lee de `public_products`, mismo grant que ya tiene la vista para `anon`) — devuelve
`id`/`slug`/`name`/`brand_id`/`category_id`/`created_at`/`rank`, ordenada por
`ts_rank` descendente. El listado (`/catalogo?q=...`) la usa para filtrar y, si el
orden activo es "relevancia", también para ordenar — con búsqueda activa el orden
por nombre/más nuevos sigue disponible, intersectando los mismos ids.

---

## 6. Ficha de producto

Nombre, marca, categoría, galería de imágenes (`product_images`, ordenadas por
`position`, una marcada `is_primary`), descripción corta y larga, specs (los
`product_attributes` de esa categoría, agrupados y con su `label`/`unit`).

**Precio:** se resuelve con `resolvePrice(product, ctx)` de `packages/core` —
`null` sin sesión. La UI nunca lee `product.price_cop` directo (regla de
`05-RLS-SECURITY.md` sección 3). Sin sesión, el CTA es "Inicia sesión para ver
precios"; con sesión, el precio real (o "sujeto a confirmación" si
`price_is_stale`, según `08-INTEGRATION-SIIGO.md`).

**Manuales/fichas técnicas** (`product_documents`): fuera de esta fase. La tabla
existe con RLS bloqueada (sin políticas) hasta que el módulo de postventa decida
el acceso real (comprado vs. no comprado).

---

## 7. Comparador

Máximo 3 productos, **misma `category_id`** — no tiene sentido comparar una
balanceadora con un escáner. Compara los `attribute_definitions` de esa
categoría marcados `is_comparable = true`, en el orden de `position`. La
selección de productos a comparar vive en el estado del cliente (no persiste en
la base) — se agrega vía un botón en el listado/ficha, con un límite duro de 3.

---

## 8. Desarrollo sin credenciales de Siigo: `SiigoMockClient`

Mientras las credenciales reales sigan `PENDIENTE-DECISIÓN`
(`08-INTEGRATION-SIIGO.md`), `packages/integrations` expone un
`SiigoMockClient` con el mismo contrato que tendrá el cliente real
(`getProductPrice(sku)`, `getProductStock(sku)`), devolviendo datos
determinísticos de prueba (semilla fija por `sku`, sin llamadas de red). Permite
construir y probar `resolvePrice`, el listado y la ficha sin depender de que
Siigo esté conectado. Se reemplaza por el cliente real cuando existan
credenciales — mismo contrato, sin tocar el código que lo consume.

---

## 9. SEO

Metadatos (`title`/`description`), sitemap y JSON-LD (`schema.org/Product`)
**sin bloque `offers`** para anónimos — el precio nunca entra al JSON-LD, al
sitemap, ni a ningún `<meta>` (regla de `05-RLS-SECURITY.md` sección 3, cuarta
fuga de la tabla). Verificado con "ver código fuente" de la página como
usuario sin sesión: cero apariciones de `price_cop` o un monto en COP.
