# Tecni Equipos y Servicios SAS — Plataforma web

Portal comercial y de postventa B2B para maquinaria, herramientas, repuestos y
consumibles del sector automotriz.

> **Soluciones que construyen confianza**

---

## Antes de tocar nada

Lee **[`CLAUDE.md`](./CLAUDE.md)**. Es el documento maestro: reglas de oro,
stack, reglas de negocio y flujo de trabajo obligatorio.

Después, el índice completo de documentación está en
**[`docs/00-INDEX.md`](./docs/00-INDEX.md)**.

## Stack

Turborepo · Next.js 15 · TypeScript · Tailwind v4 · Supabase · Cloudflare R2 ·
Resend · Wompi · Siigo Nube Pro · Vercel · GitHub

## Estado

**Fase 0 — Fundación.** Documentación completa, sin código de aplicación todavía.
Ver [`docs/21-ROADMAP.md`](./docs/21-ROADMAP.md) y
[`docs/progress/TODO.md`](./docs/progress/TODO.md).

## Reglas que no se negocian

1. Ningún archivo `.md` supera 500 líneas.
2. Toda tabla lleva RLS habilitada en la misma migración que la crea.
3. `SUPABASE_SERVICE_ROLE_KEY` jamás sale del servidor.
4. Los precios no se sirven a usuarios anónimos, en ningún formato.
5. La lógica de negocio vive en `packages/core`, nunca en componentes.
6. Al terminar una tarea se publica en `main` — salvo que falle el typecheck,
   el lint, o haya un secreto sin ignorar. Ver `CLAUDE.md` sección 10.

## Estructura

```
CLAUDE.md          documento maestro
docs/              documentación por módulo
docs/adr/          decisiones arquitectónicas
docs/progress/     decisiones, TODO, changelog
design/stitch/     exports de Google Stitch (referencia, no se compila)
apps/web/          aplicación Next.js
packages/          core, db, ui, integrations, shared, config
```
