# TAREA: Productos — imágenes múltiples, fichas técnicas y carga masiva Siigo

**Estado:** Completa · **Riesgo:** Riesgoso (RLS nueva, integración R2, dependencias nuevas)
**Inicio:** 2026-08-10 · **Última actualización:** 2026-08-10

## Objetivo

Master pidió tres cosas en `/admin/productos`:
1. Subir varias imágenes por producto (ya existe `product_images`, sin UI).
2. Subir fichas técnicas/documentos por producto, visibles en la pestaña
   "Especificaciones técnicas" del catálogo público.
3. Importación masiva desde el Excel que exporta Siigo.

**No entra en esta tarea:**
- Sincronización automática con la API de Siigo (ya existe por separado,
  `docs/08-INTEGRATION-SIIGO.md` — el importador de esta tarea es manual,
  vía archivo, no reemplaza esa integración).
- El Excel puede traer precio/stock, pero el importador **nunca los toca**
  — decisión del usuario (AskUserQuestion): el precio solo viene de la
  sincronización Siigo ya diseñada (regla de negocio 5.3 de `CLAUDE.md`).

## Documentos consultados

- `docs/11-STORAGE-R2.md` — no existe todavía (⬜ pendiente en `00-INDEX.md`).
  Se crea en esta tarea.
- `docs/12-MODULE-CATALOG.md` sección 6 — manuales/fichas, `product_documents`
  sin política.
- `docs/19-DEPLOYMENT.md` — variables `R2_*` ya están en el esquema
  (`packages/shared/src/env.ts`), opcionales, sin valor real en este entorno.

## Decisiones tomadas durante la ejecución

- 2026-08-10 (AskUserQuestion): el importador **no** conoce el formato exacto
  del Excel de Siigo todavía → se construye con **mapeo de columnas
  configurable** (el master asocia columna del archivo → campo del producto
  la primera vez, en vez de asumir nombres de columna fijos que podrían
  romper con el archivo real).
- 2026-08-10 (AskUserQuestion): el importador construye el código de subida a
  R2 real (usa `R2_*` de `serverEnv`) aunque este entorno no tenga
  credenciales reales — no se puede probar la subida real acá, sí en
  producción tras `vercel env pull`.
- 2026-08-10: `product_documents` no tenía ninguna política RLS (bug
  preexistente, confirmado por el comentario en `product-tabs.tsx`) — se
  corrige en el paso 1.1, es un prerrequisito de todo lo demás.

---

## Plan

### Fase 1 — RLS y esquema

- [x] **1.1** Migración: políticas RLS de `product_documents` (lectura:
      `is_public = true` para cualquiera, o dueño del equipo si es manual
      privado, o master; escritura: solo master).
  - Verificación: `select` desde `anon` solo ve `is_public = true`.
  - Reversión: `drop policy` correspondientes.

### Fase 2 — Integración R2 (`packages/integrations`)

- [x] **2.1** Cliente R2 (S3-compatible, `@aws-sdk/client-s3`) — subir buffer,
      generar key, borrar objeto.
  - Verificación: `pnpm --filter @tecni/integrations typecheck`.
  - Reversión: eliminar el módulo.
- [x] **2.2** `docs/11-STORAGE-R2.md` — cómo se generan las keys, qué campos
      guarda cada tabla, cómo se prueba en producción.
  - Verificación: `docs/00-INDEX.md` actualizado en el mismo commit.
  - Reversión: revertir el diff.

### Fase 3 — Imágenes múltiples

- [x] **3.1** `packages/core`: `addProductImage`, `deleteProductImage`,
      `reorderProductImages`/`setPrimaryProductImage`.
  - Verificación: tests unitarios con cliente falso.
  - Reversión: revertir el diff.
- [x] **3.2** UI en `/admin/productos/[id]`: sección "Imágenes" — subir
      varias a la vez, marcar principal, eliminar.
  - Verificación: subir 2 imágenes, marcar una principal, ver que el
    catálogo público las muestra en la galería ya existente.
  - Reversión: revertir el diff.

### Fase 4 — Fichas técnicas / documentos

- [x] **4.1** `packages/core`: `addProductDocument`, `deleteProductDocument`.
  - Verificación: tests unitarios.
  - Reversión: revertir el diff.
- [x] **4.2** UI en `/admin/productos/[id]`: sección "Documentos" — subir
      PDF/archivo, marcar público (ficha técnica) o privado (manual de
      postventa), eliminar.
  - Verificación: subir un documento público, verlo en la pestaña
    "Especificaciones técnicas" de `/catalogo/[slug]`.
  - Reversión: revertir el diff.
- [x] **4.3** `catalogo/[slug]/page.tsx` + `product-tabs.tsx`: lista de
      documentos públicos dentro de la pestaña de especificaciones (enlace
      de descarga real, nunca "Manual PDF" inventado).
  - Verificación: producto sin documentos no muestra la sección; con
    documentos, sí.
  - Reversión: revertir el diff.

### Fase 5 — Importación masiva desde Excel

- [x] **5.1** Dependencia `xlsx` (SheetJS) — parseo server-side.
  - Verificación: `pnpm install` sin conflictos.
  - Reversión: `pnpm remove xlsx`.
- [x] **5.2** `packages/core`: `bulkImportProducts` — recibe filas ya
      mapeadas a campos (`sku`, `name`, `categoryName`, `brandName`, `type`,
      etc.), hace upsert por `sku`, nunca toca `price_cop`/`stock_status`.
  - Verificación: tests unitarios (crea, actualiza, reporta error por fila).
  - Reversión: revertir el diff.
- [x] **5.3** `/admin/productos/importar`: paso 1 sube el archivo y muestra
      las columnas detectadas; paso 2 el master mapea cada columna del
      archivo a un campo del producto (persistido en `localStorage` para no
      repetirlo cada vez si el archivo siempre trae las mismas columnas);
      paso 3 previsualiza y confirma; resultado con contador real de
      creados/actualizados/errores.
  - Verificación: importar un `.xlsx` de prueba con 3 filas (una nueva, una
    que actualiza un SKU existente, una con error deliberado).
  - Reversión: revertir el diff.

---

## Bitácora

### 2026-08-10 — inicio

- **Hecho:** research de esquema/RLS actual, `AskUserQuestion` para decisiones
  bloqueantes (formato Excel, credenciales R2), archivo de tarea creado.
- **Resultado:** listo para ejecutar Fase 1.

---

## Bloqueos

Ninguno — decisiones bloqueantes ya resueltas (ver arriba).

## Pendientes descubiertos

- Ninguno todavía.
