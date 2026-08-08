# ADR-0004 — Umbral configurable de $5.000.000 COP para cotización

Volver a [`00-INDEX.md`](../00-INDEX.md) · Regla de negocio en [`../CLAUDE.md`](../../CLAUDE.md) sección 5.2

**Estado:** Aceptada · **Fecha:** 2026-08-08

## Contexto

Tecni vende desde insumos de bajo valor hasta maquinaria pesada
(alineadoras, elevadores). Una compra de bajo valor se resuelve bien con
un carrito y pasarela de pago tradicional; un equipo de alto valor
necesita asesoría comercial, negociación de condiciones de pago y, en
ocasiones, visita técnica previa — un botón de "comprar" no resuelve eso
y puede incluso generar fricción o desconfianza.

Hacía falta una regla clara de cuándo un producto se compra directo y
cuándo pasa por un vendedor, y decidir si esa regla es un valor fijo en
código o un parámetro operable.

## Decisión

- Producto **< $5.000.000 COP** → compra directa: carrito → Wompi →
  pedido.
- Producto **≥ $5.000.000 COP** → sin botón de compra; el usuario ve
  **"Solicitar cotización"**, que crea una solicitud asignada a un
  vendedor.
- El umbral es un **parámetro de configuración**
  (`settings.quote_threshold_cop`), editable desde el panel maestro
  (Fase 5) — **nunca hardcodeado** en el frontend ni en `packages/core`.
- Un carrito mixto (algunos ítems bajo el umbral, otros sobre él) se
  divide explícitamente: lo que se puede pagar, se paga; lo que no,
  pasa a solicitud de cotización. El usuario ve esta separación antes de
  pagar, no después.

## Consecuencias

**Positivas**
- Tecni puede ajustar el umbral según su realidad comercial (inflación,
  estrategia de precios) sin pedir un despliegue.
- El flujo de alto valor obtiene acompañamiento humano donde el negocio
  lo necesita, sin bloquear la compra directa de todo lo demás.
- Un único punto de verdad (`settings.quote_threshold_cop`) evita que el
  umbral quede duplicado e inconsistente entre frontend y backend — se
  resuelve siempre en `packages/core`.

**Negativas / costo asumido**
- El carrito mixto es más complejo de implementar y de comunicar en la
  UI que un carrito simple; requiere un componente dedicado (Fase 3).
- Un umbral mal configurado por el master (p. ej. demasiado bajo) puede
  saturar al equipo de ventas con solicitudes de cotización de productos
  económicos — mitigado con que el cambio quede en `audit_log` (regla de
  oro 8 de `CLAUDE.md`) y sea visible para revisión.

## Alternativas descartadas

- **Umbral fijo en código:** más simple de implementar, pero cualquier
  ajuste requeriría un despliegue y coordinación con desarrollo por un
  cambio puramente comercial. Descartado.
- **Sin umbral, todo pasa por cotización:** elimina la fricción de decidir,
  pero fuerza acompañamiento humano incluso en compras pequeñas donde no
  aporta valor y sí añade demora. Descartado.
