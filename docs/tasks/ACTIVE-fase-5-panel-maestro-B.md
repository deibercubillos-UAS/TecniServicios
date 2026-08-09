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

## Bloqueos

- **R2 sin empezar:** bloquea subir imágenes/manuales reales
  (`docs/11-STORAGE-R2.md`). No bloquea el resto de la fase — el CRUD
  usa campos de texto/URL mientras tanto.

## Pendientes descubiertos

Ninguno todavía.
