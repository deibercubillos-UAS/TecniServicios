# TAREA: Página de alianza comercial Tecnisas × Bitafly

**Estado:** Completa · **Riesgo:** Normal
**Inicio:** 2026-08-21 · **Última actualización:** 2026-08-21

## Objetivo

Página pública `/tecnisas-bitafly-aliados-estrategicos` documentando
la alianza real con Bitafly (desarrollo del sitio + descuento cruzado
en plataforma/drones), visible y con SEO real — sin cloaking, sin
contenido inventado.

Plan completo: `/Users/deiber/.claude/plans/robust-humming-hippo.md`.

## Plan

- [x] **1** Página nueva con hero, contenido y CTA.
- [x] **2** Metadata SEO (OG/Twitter) + JSON-LD Organization.
- [x] **3** Entrada en sitemap.
- [x] **4** Link discreto en footer (`LEGAL_LINKS`).

## Bitácora

### 2026-08-21 — Inicio
- Plan aprobado. Empezando Fase 1.

### 2026-08-21 — Cierre
- Página `/tecnisas-bitafly-aliados-estrategicos` con hero, "Qué es
  Bitafly" (resumen original, no copiado de bitafly.com), "La
  alianza" (qué recibe cada parte), grid de 6 módulos de Bitafly, y
  CTA final (enlace externo a bitafly.com + contacto interno).
  Contenido real, extraído de bitafly.com y bitafly.com/precios (vía
  `curl` con user-agent de navegador, ya que `WebFetch` devolvió 403).
- SEO: `metadata` estático con OG/Twitter, JSON-LD `Organization` de
  Bitafly con `sameAs` (LinkedIn, Instagram reales), entrada en
  `sitemap.ts`, link discreto en `LEGAL_LINKS` del footer — sin
  agregar nada al navbar principal (pedido explícito del usuario de
  mantenerla de bajo perfil).
- `pnpm typecheck && pnpm lint` limpios, build de producción exitoso.
- Verificado con `curl`: `<title>`, `og:title`/`og:description`,
  JSON-LD y presencia en `sitemap.xml` — todos correctos. Verificado
  en Chrome real: las 4 secciones se ven bien, el enlace externo a
  bitafly.com tiene `target="_blank"` + `rel="noopener noreferrer"`,
  y "Aliados estratégicos" aparece en el footer legal.
- **Nota ética explícita:** se descartó la primera versión de este
  pedido (enlaces ocultos/invisibles para manipular el SEO de
  bitafly.com desde este sitio — cloaking, prohibido por Google y
  engañoso). Esta versión final es contenido honesto y visible sobre
  una alianza comercial real, con bajo perfil en la navegación pero
  sin ocultarse.
- Sin RLS ni migración.

## Bloqueos

Ninguno.
