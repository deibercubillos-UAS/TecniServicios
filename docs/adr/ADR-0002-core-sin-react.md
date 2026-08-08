# ADR-0002 — Lógica de negocio aislada en packages/core para habilitar APK

Volver a [`00-INDEX.md`](../00-INDEX.md) · Detalle en [`01-ARCHITECTURE.md`](../01-ARCHITECTURE.md)

**Estado:** Aceptada · **Fecha:** 2026-08-08

## Contexto

La Fase 7 del roadmap (`21-ROADMAP.md`) contempla una app móvil (APK) que
consuma la misma plataforma, priorizando al técnico (agenda, reportes en
sitio, foto y firma, offline) y luego al cliente (tickets, seguimiento de
pedidos). Esa app consumirá `/api/v1` sin cambios en el backend.

Si la lógica de negocio (resolución de precios, umbral de cotización,
estados de pedido, asignación de técnicos, auditoría) viviera mezclada en
componentes de React o en route handlers de Next.js, extraerla para el
APK — o para cualquier otro cliente — significaría reescribirla.

## Decisión

Toda la lógica de negocio vive en `packages/core`, organizada por dominio
(`catalog/`, `commerce/`, `service/`, `companies/`, `content/`, `audit/`),
**sin ninguna dependencia de React ni de Next.js**. Una función de `core`
recibe siempre un contexto explícito (`{ userId, companyId, role }`) y
nunca lee la sesión por su cuenta — eso la hace testeable de forma
aislada y reutilizable desde cualquier cliente (web, APK, un script de
administración).

`app/api/v1/*` y los Server Actions son capas delgadas que validan
entrada (Zod, vía `packages/shared`), llaman a `packages/core`, y
devuelven la respuesta. Nunca contienen la regla de negocio en sí.

## Consecuencias

**Positivas**
- El APK futuro consume `/api/v1` sin tocar el backend: la regla ya está
  escrita una sola vez.
- `packages/core` se puede testear con Node puro, sin levantar Next.js
  ni un navegador — pruebas más rápidas y más simples.
- Reduce el riesgo de que una regla de negocio (p. ej. el umbral de
  cotización) quede duplicada e inconsistente entre un componente y un
  endpoint.

**Negativas / costo asumido**
- Disciplina constante: es fácil, bajo presión de tiempo, escribir una
  regla directamente en un Server Action "porque es más rápido". Se
  compensa con la regla de oro de `CLAUDE.md`: si una funcionalidad solo
  se puede usar desde el navegador porque la lógica quedó en el
  componente, está mal construida.
- Una capa adicional de indirección para cambios simples.

## Alternativas descartadas

- **Lógica en Server Actions / route handlers directamente:** más rápido
  de escribir al inicio, pero ata la regla de negocio a Next.js y la
  duplica en cuanto exista un segundo cliente (el APK).
