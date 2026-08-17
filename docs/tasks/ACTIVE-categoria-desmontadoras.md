# TAREA: Categoría "Desmontadoras" + productos TECNIMAX-302 y TECNI-302

**Estado:** Completada (faltan 2 fotos — las sube el usuario) · **Riesgo:** Normal
**Inicio:** 2026-08-16 · **Última actualización:** 2026-08-16

## Objetivo

Cargar la categoría "Desmontadoras" con especificaciones técnicas
reales (ficha `ficha_tecnimax302_editorial_llantas (1).pdf`) y el
producto TECNIMAX-302 con foto extraída de la ficha (material propio
de TecniServicios, sin duda de derechos).

Plan completo: `/Users/deiber/.claude/plans/robust-humming-hippo.md`.

## Plan

### Fase 1 — Categoría y especificaciones
- [x] **1.1** Migración: insertar categoría "Desmontadoras".
- [x] **1.2** Ícono en `category-icons.ts`.
- [x] **1.3** Migración: 11 `attribute_definitions`.

### Fase 2 — Producto TECNIMAX-302
- [x] **2.1** Marca "Tecnimax".
- [x] **2.2** Insertar producto (sin precio).
- [x] **2.3** Insertar 11 `product_attributes`.
- [ ] **2.4** Subir foto — bloqueado, ver bitácora. La sube el usuario
      desde `/admin/productos/4af50dac-0725-4ec3-bd35-7e94c93fec63`.

## Bitácora

### 2026-08-16 — Inicio
- Plan aprobado. Empezando Fase 1.

### 2026-08-16 — Fases 1 y 2 completas (excepto la foto)
- **Hecho:** categoría `desmontadoras` (posición 7, ícono `gear`),
  11 `attribute_definitions` con valores/unidades verificados contra la
  ficha real, marca "Tecnimax" (propia de TecniServicios — la ficha es
  su catálogo propio, no un tercero, sin duda de derechos), producto
  `TECNIMAX-302` (slug `tecnimax-302`, sin precio — se sincroniza vía
  Siigo después) con sus 11 `product_attributes` cargados con los
  valores reales de la ficha.
- **Bug encontrado y corregido en el momento:** las 8 definiciones de
  texto con rango/doble-unidad (sujeción externa/interna, diámetro
  máximo, ancho máximo, nivel de ruido, presión de trabajo, potencia
  del motor, peso) traían el valor con la unidad ya embebida en el
  texto (ej. "≤ 1000 mm (39\")") **y además** la columna `unit='mm'`
  — la ficha del producto público concatena valor + unidad
  automáticamente (`catalogo/[slug]/page.tsx:158`), duplicando la
  unidad visualmente ("≤ 1000 mm (39\") mm"). Corregido dejando
  `unit = null` en esas 8 definiciones (el valor ya es autodescriptivo)
  — verificado visualmente en build de producción real que ya no se
  duplica.
- **Bloqueo real, no resuelto por mí:** no pude subir la foto del
  producto (recortada de la ficha, sin la etiqueta de marketing,
  preparada en el scratchpad) porque el `.env.local` local tiene las
  credenciales R2 enmascaradas (`"[SENSITIVE]"`) por diseño — nunca
  llegan a mis manos en texto plano, ni siquiera para un script
  puntual. La foto se envía al usuario para que la suba él mismo desde
  `/admin/productos/4af50dac-0725-4ec3-bd35-7e94c93fec63` (primera
  imagen del producto → queda automáticamente como principal y como
  hero de categoría, mismo comportamiento por defecto ya implementado
  en `addProductImage`).
- **Verificación:** `pnpm typecheck`/`lint` en verde, `get_advisors`
  sin hallazgos nuevos en ninguna de las dos migraciones. Build de
  producción real: `/catalogo/categoria/desmontadoras` y
  `/catalogo/tecnimax-302` responden 200, specs se ven correctas y sin
  duplicación tras el fix, "Inicia sesión para ver precios" (esperado,
  sin precio).
- **Commit:** hecho — solo las dos migraciones SQL; la
  categoría/producto/atributos ya están en la base real (no son código
  versionado, son datos de negocio).

### 2026-08-16 — Incidente de producción (aparte, ver DONE aparte) y segundo producto: TECNI-302
- Entre medio: incidente real en producción (`CRON_SECRET` vacía
  tumbando `/middleware` en todo el sitio) — atendido y corregido
  aparte, no forma parte de esta tarea.
- El usuario trajo una segunda ficha (`ficha_tecni302_tipografia_final.pdf`),
  mismas especificaciones exactas pero modelo/marca **TECNI-302** (no
  TECNIMAX-302 — logo distinto en la foto). Confirmado con el usuario
  vía pregunta: es un **producto distinto**, no una corrección de
  nombre — se crea aparte, sin tocar TECNIMAX-302.
- **Hecho:** marca "TECNI" (`c0e5f893-2fd8-4d6a-a13c-f21ce34dc5da`),
  producto `TECNI-302` (slug `tecni-302`, id
  `419b008d-452c-438c-b325-84eb39d692cb`, sin precio) con sus 11
  `product_attributes` (mismos valores que TECNIMAX-302 — la ficha es
  idéntica salvo el nombre/logo). Foto extraída y recortada igual que
  la anterior, enviada al usuario para que la suba.
- **Verificación:** build de producción real —
  `/catalogo/categoria/desmontadoras` ahora muestra "2 referencias"
  (TECNI-302 y TECNIMAX-302 como pestañas del hero), `/catalogo/tecni-302`
  responde 200 con las specs correctas sin duplicación de unidad.
- **Commit:** no aplica — solo datos, sin cambios de código en esta
  parte.

## Bloqueos

Falta que el usuario suba 2 fotos (TECNIMAX-302 y TECNI-302, ambas ya
enviadas) — no es un bloqueo de código, es el único paso que requiere
credenciales que no tengo.
