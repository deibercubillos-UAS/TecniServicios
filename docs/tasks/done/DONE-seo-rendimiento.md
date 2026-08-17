# TAREA: Corregir hallazgos de SEO y rendimiento

**Estado:** Completa · **Riesgo:** Grande (superficie, no complejidad)
**Inicio:** 2026-08-17 · **Última actualización:** 2026-08-16

## Objetivo

Corregir los 7 hallazgos reales de la auditoría SEO/rendimiento previa
(el 8vo — quitar `force-dynamic` del home — se descartó, ver plan: la
home ya es dinámica por `cookies()`, no hay optimización real ahí).

Plan completo: `/Users/deiber/.claude/plans/robust-humming-hippo.md`.

## Plan

- [x] **1.1** `packages/ui` peerDependency `next`.
- [x] **1.2** `next.config.ts` remotePatterns.
- [x] **2.1-2.9** Migrar `<img>` públicos a `next/image`.
- [x] **3** Alt text real donde falta.
- [x] **4** Open Graph/Twitter en catálogo/categoría/home.
- [x] **5** Sitemap: agregar categorías.
- [x] **6** BreadcrumbList en catálogo/categoría.
- [x] **7** preconnect al host de imágenes.

## Bitácora

### 2026-08-17 — Inicio
- Plan aprobado. Empezando Fase 1.

### 2026-08-16 — Cierre
- Las 7 fases implementadas y verificadas: `pnpm typecheck && pnpm lint`
  limpios en las 6 paquetes/apps, `pnpm build` de producción exitoso.
- **Bug real encontrado y corregido durante la verificación visual:**
  varios productos usan `placehold.co` como `product_images.url`
  (brecha de datos ya conocida — no tienen foto real subida). Al migrar
  de `<img>` a `next/image`, esas imágenes empezaron a devolver 400:
  1. Causa parcial: `placehold.co` no estaba en `images.remotePatterns`
     — corregido agregándolo.
  2. Causa real restante: `placehold.co` sirve `image/svg+xml`, y el
     optimizador de `next/image` bloquea SVG remoto por defecto (puede
     llevar `<script>`). Corregido con `dangerouslyAllowSVG: true` +
     `contentSecurityPolicy` estricta en la config de imágenes — el
     host ya está allowlisted arriba y el placeholder es generado por
     texto/color, no un upload de terceros.
  - Confirmado con `read_network_requests` (200 en vez de 400) y DOM
    (`img.complete === true`, `naturalWidth` real) en `/catalogo`, una
    ficha de producto y una página de categoría.
- Verificación visual completa en Chrome real: home, `/catalogo`
  (grid), ficha de producto (galería + relacionados), página de
  categoría (coverflow), `/blog` (listado) — sin imágenes rotas.
  Nota: los 3 posts de blog no tienen `cover_url` (brecha de datos
  preexistente, no un bug) — el fallback gris es el comportamiento
  correcto del código.
- `<head>` de `/catalogo`, una categoría y home confirmados con
  `og:title`/`og:description`/`og:url` (y `og:image` en categoría).
- `sitemap.xml` confirmado con 7 categorías incluidas.
- Sin cambios de RLS ni migraciones — no aplica `get_advisors`.

## Bloqueos

Ninguno.
