# TAREA: Cerrar brechas de UX vs. benchmark Hunter

**Estado:** En curso · **Riesgo:** Grande (5 fases independientes, 3 con migración aditiva)
**Inicio:** 2026-08-16 · **Última actualización:** 2026-08-16

## Objetivo

Cerrar 5 brechas identificadas en el análisis UX/UI comparativo contra
es.hunter.com de esta conversación, más una mejora nueva pedida por el
usuario:

1. Footer completo (datos reales de `settings`, sin migración).
2. Página 404 con diseño propio.
3. Sistema de testimonios reales (vacío hasta que el usuario cargue).
4. Ficha de producto: secciones de beneficios + video.
5. Hero-carrusel con overlay de texto por categoría en `/catalogo/categorias`.

**No entra en esta tarea:** redes sociales/newsletter en el footer (sin
URLs reales ni backend de suscriptores), fotos de producto reales (acción
del usuario en el panel, no código).

## Documentos consultados

- `apps/web/lib/settings-config.ts` — claves reales de `settings` ya
  disponibles para el footer.
- `docs/05-RLS-SECURITY-A.md` línea 283 — patrón de RLS de
  `banners`/`categories` (lectura pública de activos).
- `docs/04-DATABASE-SCHEMA-A.md`/`-B.md` — esquema de `products`,
  `product_attributes`, `banners`.
- Capturas en vivo de es.hunter.com tomadas en esta conversación (mega
  menú, ficha de producto, footer, 404).

## Decisiones tomadas (confirmadas con el usuario vía `AskUserQuestion`)

- 2026-08-16: footer usa datos reales de `settings` ya existentes, campos
  vacíos se ocultan — sin inventar direcciones/teléfonos.
- 2026-08-16: testimonios se construye el sistema completo, queda vacío
  (sección oculta) hasta que el usuario cargue testimonios reales.
- 2026-08-16: hero-carrusel por categoría reusa `banners`
  (`category_id` + placement `category_hero`), no una tabla nueva.

---

## Plan

### Fase 0 — Housekeeping

- [x] **0.1** Pausar `ACTIVE-import-hunter-pilot.md`, crear este archivo.

### Fase 1 — Footer completo

- [x] **1.1** Reescribir `site-footer.tsx` con datos reales de `settings`
      (contacto, ubicación/horario, sitemap real) — campos vacíos ocultos.
      Extraída `getContactSettings`/`PLACEHOLDER`/`isRealContactValue` a
      `apps/web/lib/contact-settings.ts` (antes duplicado solo en
      `/contacto`) para que footer y `/contacto` compartan la misma
      consulta y el mismo criterio de "dato real vs. placeholder".
  - Verificación: `pnpm typecheck && pnpm lint` en verde. Visual en build
    de producción real (`pnpm build && pnpm start`, el `next dev` local
    sigue bloqueado por el CSP estricto, ver tarea anterior): con los
    `settings` de contacto todavía en placeholder, el footer muestra
    correctamente solo logo/slogan + columna "Explora" (sitemap real) +
    franja legal — las columnas de Contacto y Ubicación quedan ocultas,
    tal como se diseñó.
  - **Incidente de verificación (resuelto, no es bug de código):** el
    primer `pnpm build && pnpm start` no reflejaba los cambios porque un
    proceso `next-server` de una sesión anterior seguía vivo en el puerto
    3000 — `pkill -f "next start"` no lo mata porque el proceso corre
    como `next-server`, no con ese literal en el cmdline. Se identificó
    con `lsof -iTCP:3000` + `ps aux`, se mató por PID (`kill -9`) y se
    reinició limpio. Confirmado con curl del HTML crudo antes/después.

### Fase 2 — Página 404

- [x] **2.1** `apps/web/app/not-found.tsx` con diseño propio.
  - Verificación: `pnpm typecheck && pnpm lint` en verde. `pnpm build &&
    pnpm start`, ruta inexistente → 404 real (confirmado con `curl -o
    /dev/null -w "%{http_code}"`) y visual correcto en Chrome (header +
    footer completos alrededor, ícono de marca, badge "ERROR 404", título
    en mayúsculas, 2 CTAs a inicio y catálogo).

### Fase 3 — Testimonios

- [x] **3.1** Migración `testimonials` + RLS (`testimonials_read_public`
      lectura pública solo de activos, `testimonials_write_master`
      escritura solo master) — aplicada al proyecto Supabase `tecni`
      (`sieiprqcvubkmrmvwwik`) vía `mcp__Supabase__apply_migration`.
- [x] **3.2** `createTestimonial`/`updateTestimonial`/`deleteTestimonial`
      en `packages/core/src/content/manage-testimonial.ts`, exportadas
      desde `packages/core/src/index.ts`.
- [x] **3.3** Panel `/admin/testimonios` (lista + nuevo + editar/eliminar),
      enlazado en `apps/web/lib/dashboard-nav.ts` bajo "Contenido".
- [x] **3.4** Sección "Lo que dicen nuestros clientes" en el home, oculta
      por completo sin testimonios activos.
  - Verificación: `pnpm typecheck && pnpm lint` en verde (web + core).
    `pnpm build` genera las 3 rutas de `/admin/testimonios`. Con la tabla
    vacía, el home no renderiza la sección (confirmado con `curl` +
    visual). Insertado un testimonio real de prueba directo en Supabase
    (`execute_sql`) → la sección aparece correctamente en el home; borrado
    después → la sección desaparece de nuevo. `get_advisors` (security)
    sin hallazgos nuevos para `testimonials` (RLS aplicada correctamente).
    No se probó el flujo del panel `/admin/testimonios` en navegador (sin
    sesión de master en este entorno local) — el CRUD se verificó
    directo contra la base y el build confirma que las rutas compilan.

### Fase 4 — Ficha de producto: beneficios + video

- [ ] **4.1** Migración `product_benefits` + `products.video_url` + RLS.
- [ ] **4.2** Funciones en `packages/core`.
- [ ] **4.3** UI admin + ficha pública.
  - Verificación: producto con beneficios reales se ve bien; producto sin
    beneficios no cambia.

### Fase 5 — Hero-carrusel por categoría

- [ ] **5.1** Migración `banners.category_id` + placement `category_hero`.
- [ ] **5.2** Admin `/admin/banners` con selector de categoría.
- [ ] **5.3** `/catalogo/categorias` con carrusel condicional.
  - Verificación: subir fotos de prueba, confirmar carrusel y que
    categorías sin fotos nuevas no se rompen.

## Bitácora

### 2026-08-16 — paso 0.1
- **Hecho:** pausada `ACTIVE-import-hunter-pilot.md`, creado este archivo.
- **Commit:** pendiente (se hace junto con el primer paso de código).

## Bloqueos

Ninguno.
