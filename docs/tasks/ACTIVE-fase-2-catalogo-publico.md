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

- [ ] **1.1** Escribir `docs/12-MODULE-CATALOG.md`: filtros, búsqueda,
  ficha, comparador, contrato de sincronización con Siigo (qué se
  sincroniza, qué pasa si Siigo no responde — `price_is_stale`).
  - Verificación: archivo existe, bajo 500 líneas, actualiza `00-INDEX.md`.
- [ ] **1.2** Agregar sección "Catálogo" a `05-RLS-SECURITY.md` con las
  políticas exactas de `product_images`, `attribute_definitions`,
  `product_attributes`, `product_documents` (las de `categories`/
  `brands`/`products` ya están escritas, secciones 1–3).
  - Verificación: cada tabla nueva de esta fase tiene su política
    escrita antes de migrar.

### Fase 2 — Esquema, RLS bloqueada desde el primer commit

- [ ] **2.1** Migración `categories` (con jerarquía `parent_id`).
- [ ] **2.2** Migración `brands`.
- [ ] **2.3** Migración `products` (usa `product_type`, ya existe del
  enum de la Fase 1) + vista `public_products`.
- [ ] **2.4** Migración `product_images`.
- [ ] **2.5** Migración `attribute_definitions` + `product_attributes`.
- [ ] **2.6** Migración `product_documents`.
- [ ] **2.7** `get_advisors` (seguridad) — cero advertencias sin justificar.

Cada paso: RLS habilitada en la misma migración que crea la tabla, sin
políticas todavía. Verificación por mecanismo (`pg_class.relrowsecurity`
+ `pg_policies` en 0), mismo patrón que la Fase 1.

### Fase 3 — Políticas RLS (permiso por permiso)

- [ ] **3.1** `categories`/`brands`: lectura `anon`+`authenticated` de
  filas activas, escritura solo `master`.
- [ ] **3.2** `products`: `products_read_authenticated` (`to
  authenticated`) + `products_write_master`. `public_products` (vista,
  sin `price_cop`) para `anon` — grant explícito de `select` a `anon`
  sobre la vista.
- [ ] **3.3** `product_images`/`attribute_definitions`/
  `product_attributes`: lectura `anon` vía subconsulta a
  `public_products` (no a `products` directo — mismo problema de
  encadenamiento de RLS que `auth_company_ids()` en la Fase 1).
- [ ] **3.4** `product_documents`: **sin políticas**, documentado por
  qué (postventa no existe todavía).
- [ ] **3.5** `get_advisors` de cierre.

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

(se completa al terminar cada paso)

## Bloqueos

- **Home (paso 6.1):** requiere que el usuario genere la pantalla en
  Stitch — no puedo generarla yo. Bloquea 6.2/6.3 hasta que exista el
  export en `design/stitch/home/`.
- **Inventario real:** sigue bloqueante en `progress/TODO.md`. Esta
  tarea usa datos de prueba, no bloquea el resto.

## Pendientes descubiertos

(se completa según aparezcan)
