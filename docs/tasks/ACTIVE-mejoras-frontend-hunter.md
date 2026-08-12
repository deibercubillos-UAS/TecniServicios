# TAREA: Mejoras de frontend inspiradas en benchmark Hunter Engineering

**Estado:** En curso · **Riesgo:** Normal (Fase 1 y 2) / Grande (Fase 3, toca header en todas las páginas)
**Inicio:** 2026-08-11 · **Última actualización:** 2026-08-11

## Objetivo

Aplicar al frontend real los patrones visuales identificados al auditar
es.hunter.com/es-int (ver `docs/02-DESIGN-SYSTEM.md` sección 4 y
`docs/03-UI-COMPONENTS.md` sección 3): hero oscuro en ficha de producto,
card de categoría con overlay, barra sticky de CTA en ficha, mega-menú de
catálogo.

**No entra en esta tarea:** rediseño de home (ya migrada de Stitch y
auditada en Fase 2), cambios de paleta o tipografía (el benchmark confirmó
la dirección actual, no la cambia).

## Documentos consultados

- `docs/02-DESIGN-SYSTEM.md` sección 4 — patrones adoptados del benchmark
- `docs/03-UI-COMPONENTS.md` sección 3 — spec de los 3 componentes nuevos
- `apps/web/components/site-header.tsx` — header real, nav plana actual
- `packages/ui/src/button.tsx` — `secondary` ya es outline-sobre-oscuro,
  no hace falta variante nueva

## Decisiones tomadas durante la ejecución

- 2026-08-11: el mega-menú (Fase 3) se implementa último y solo si el
  número real de categorías lo justifica — evita construir un componente
  de tres columnas para 4 categorías. Se revisa el conteo real en
  `packages/core` antes de empezar esa fase.

---

## Plan

### Fase 1 — Documentación (hecho en esta sesión)

- [x] **1.1** Documentar los 5 hallazgos del benchmark en
      `02-DESIGN-SYSTEM.md` sección 4.
  - Verificación: sección visible, sin exceder 500 líneas del archivo.
  - Reversión: `git revert` del commit.
- [x] **1.2** Documentar spec de `CategoryHeroCard`, `StickyProductCta`,
      `CatalogMegaMenu` en `03-UI-COMPONENTS.md` sección 3.
  - Verificación: cada componente tiene comportamiento y reglas de datos
    explícitas, ninguna decisión de diseño librada a quien lo codee.
  - Reversión: `git revert` del commit.

### Fase 2 — `CategoryHeroCard` + `StickyProductCta`

- [ ] **2.1** Implementar `CategoryHeroCard` en `packages/ui/src/`,
      consumido en el carrusel de categorías de home y en la cabecera de
      `/catalogo`.
  - Verificación: build + typecheck pasan; visual en `pnpm dev` igual al
    spec (overlay degradado, sin card blanca).
  - Reversión: quitar el import y volver al componente anterior.
- [ ] **2.2** Implementar `StickyProductCta` en
      `apps/web/app/(public)/catalogo/[slug]/page.tsx`, reusando la
      resolución de precio/umbral que ya usa la card de producto (sin
      recalcular en cliente).
  - Verificación: probar en `pnpm dev` como anónimo, como `customer` bajo
    umbral, como `customer` sobre umbral — las 3 vistas de la sección 8 de
    `CLAUDE.md` ("¿qué ve un anónimo? ¿otro rol?").
  - Reversión: quitar el componente de la página, el resto de la ficha
    sigue funcionando igual.

### Fase 3 — `CatalogMegaMenu` (condicional)

- [ ] **3.1** Contar categorías reales activas en la base de datos.
  - Verificación: si son ≤ 6, se descarta esta fase y se anota en
    "Pendientes descubiertos".
- [ ] **3.2** (si aplica) Implementar `CatalogMegaMenu`, reemplazando el
      link plano "Catálogo" en `site-header.tsx`.
  - Verificación: navegación por teclado completa (`Tab`, `Escape`,
    trampa de foco), probado en móvil (colapsa a lista simple).
  - Reversión: restaurar el `<Link href="/catalogo">` plano anterior.

---

## Bitácora

### 2026-08-11 — pasos 1.1 y 1.2

- **Hecho:** documentados los hallazgos del benchmark y los 3 componentes
  nuevos.
- **Archivos:** `docs/02-DESIGN-SYSTEM.md`, `docs/03-UI-COMPONENTS.md`.
- **Resultado:** ambos archivos siguen bajo 500 líneas.
- **Commit:** pendiente (se publica junto con este archivo de tarea).

---

## Bloqueos

- Ninguno por ahora.

## Pendientes descubiertos

- Ninguno todavía.
