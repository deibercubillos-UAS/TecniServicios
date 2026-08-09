# TAREA: Fase 5 — Panel maestro y contenido (parte A: plan)

Parte B (bitácora, bloqueos, pendientes): [`ACTIVE-fase-5-panel-maestro-B.md`](./ACTIVE-fase-5-panel-maestro-B.md)

**Estado:** En curso · **Riesgo:** Grande (escritura maestra sobre catálogo, contenido, configuración y usuarios)
**Inicio:** 2026-08-09

---

## 0. Objetivo

Que `master` opere el sitio sin pedir un despliegue: publique/edite productos,
categorías y marcas, gestione banners y promociones con vigencia, escriba y
publique el blog, cambie la configuración global (empezando por el umbral de
cotización), vea el log de auditoría y una vista básica de métricas.

**Desviación deliberada, documentada desde ya:** sin R2 conectado
(`docs/11-STORAGE-R2.md`), el CRUD de productos/banners/blog no sube
imágenes — solo campos de texto/URL externa. Subir archivos reales queda
para cuando exista esa integración, no se fabrica un uploader que no
funciona. Precios y stock siguen siendo de Siigo (regla de negocio 5.3 de
`CLAUDE.md`) — el master edita contenido, nunca `price_cop`/`stock_status`
a mano.

**Ya existente de fases previas (verificado antes de planear de más):**
`products_write_master`, `categories_write_master`, `brands_write_master`,
`product_images_write_master`, `attribute_definitions_write_master`,
`product_attributes_write_master` ya están aplicados en la base real desde
la Fase 2 — esta fase construye la UI, no repite el esquema/RLS de esas
tablas. `posts`/`banners`/`promotions` están documentadas en
`04-DATABASE-SCHEMA-B.md` pero **no existen todavía** en la base — sí hace
falta crearlas. `settings` existe desde la Fase 1 con RLS habilitada y
**cero políticas** (bloqueada por completo) — esta fase abre la primera
política de escritura real para `master`.

---

## Fase 1 — Documentación

- [ ] **1.1** `docs/15-MODULE-CONTENT.md`: blog (editor, borrador,
  programación), banners (vigencia, posición, placement), promociones
  (tipo/valor de descuento, alcance por producto o categoría).
- [ ] **1.2** `docs/16-ADMIN-MASTER.md`: panel maestro completo — catálogo,
  contenido, configuración, usuarios y roles, auditoría, métricas. Matriz
  de qué puede hacer `master` que ningún otro rol puede.
- [ ] **1.3** Sección "Contenido y configuración" en `05-RLS-SECURITY-C.md`:
  políticas completas de `posts`/`banners`/`promotions` (lectura pública
  de lo activo/publicado, escritura solo `master`) y la política de
  escritura de `settings` (lectura ya es `service_role` únicamente desde
  la Fase 1 — acá se decide si `master` también lee por sesión propia o
  sigue leyendo vía `service_role` en el servidor).

## Fase 2 — Esquema

- [ ] **2.1** Migración `posts`, RLS habilitada sin políticas.
- [ ] **2.2** Migración `banners`, RLS habilitada sin políticas.
- [ ] **2.3** Migración `promotions`, RLS habilitada sin políticas.
- [ ] **2.4** `get_advisors` (seguridad) — cero advertencias sin justificar.

## Fase 3 — RLS (prueba real: anónimo, otra empresa, rol inferior)

- [ ] **3.1** `posts`: `anon`/`authenticated` leen solo `is_published =
  true` y `published_at <= now()`; solo `master` escribe (incluidos
  borradores).
- [ ] **3.2** `banners`: `anon`/`authenticated` leen solo `is_active =
  true` dentro de vigencia; solo `master` escribe.
- [ ] **3.3** `promotions`: mismo patrón que `banners`.
- [ ] **3.4** `settings`: abre `settings_write_master` (primera política
  real de esta tabla). Probado que un `customer`/`seller`/`technician`
  siguen sin poder tocarla.
- [ ] **3.5** `get_advisors` de cierre.

## Fase 4 — Panel: catálogo

- [ ] **4.1** `/admin/productos`: lista con búsqueda, crear/editar
  (nombre, descripción, categoría, marca, specs por categoría, manuales
  como referencia de texto — sin subir archivo, sin R2). Nunca un campo
  de precio ni stock en el formulario.
- [ ] **4.2** `/admin/categorias` y `/admin/marcas`: CRUD simple.

## Fase 5 — Panel: contenido

- [ ] **5.1** `/admin/banners`: CRUD con fechas de vigencia y posición.
- [ ] **5.2** `/admin/blog`: CRUD de `posts`, botón publicar/despublicar,
  programar (`published_at` futuro).
- [ ] **5.3** `/admin/promociones`: CRUD con alcance (producto o
  categoría) y vigencia.

## Fase 6 — Panel: configuración y usuarios

- [ ] **6.1** `/admin/configuracion`: editar `settings` (empieza con
  `quote_threshold_cop`, la regla de negocio 5.2 de `CLAUDE.md` exige que
  sea editable desde acá, nunca hardcodeado).
- [ ] **6.2** `/admin/usuarios`: ver usuarios por empresa, cambiar
  `user_role`/`company_member_role`. **Corrige de paso la deuda técnica
  descubierta en el cierre de Fase 3**: `registerUser` no registraba en
  `audit_log` — un cambio de rol manual desde acá si tampoco audita
  repetiría el mismo defecto, así que esta función sí lo hace desde el
  inicio.

## Fase 7 — Auditoría y métricas

- [ ] **7.1** `/admin/auditoria`: visor de `audit_log` (ya tiene RLS de
  lectura solo `master` desde la Fase 1) — filtros por entidad/actor/fecha.
- [ ] **7.2** `/admin/metricas`: conteos básicos reales (pedidos por
  estado, cotizaciones abiertas, tickets abiertos, mantenimientos
  pendientes) — sin gráficas fabricadas, solo lo que la base ya tiene.

## Fase 8 — Cierre

- [ ] **8.1** Checklist de seguridad de `05-RLS-SECURITY-B.md` sección 9 +
  las tres preguntas de `CLAUDE.md`.
- [ ] **8.2** Actualizar `21-ROADMAP.md`/`progress/TODO.md`/
  `progress/CHANGELOG.md`, mover la tarea a `tasks/done/`.

---

## Fuera de alcance de esta fase (anotado, no se construye acá)

- Subida real de imágenes/manuales — depende de `11-STORAGE-R2.md`, sin
  empezar.
- Gráficas o dashboards visuales de métricas — solo conteos reales en
  esta fase.
- Editor de blog tipo WYSIWYG — `body` como texto/markdown plano por
  ahora, sin fabricar un editor rico que no se pidió.
