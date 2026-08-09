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

## Bloqueos

- **R2 sin empezar:** bloquea subir imágenes/manuales reales
  (`docs/11-STORAGE-R2.md`). No bloquea el resto de la fase — el CRUD
  usa campos de texto/URL mientras tanto.

## Pendientes descubiertos

Ninguno todavía.
