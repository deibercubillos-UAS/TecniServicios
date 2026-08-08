# ADR-0003 — Siigo como fuente de precios, la web como fuente de catálogo

Volver a [`00-INDEX.md`](../00-INDEX.md) · Detalle en [`08-INTEGRATION-SIIGO.md`](../08-INTEGRATION-SIIGO.md)

**Estado:** Aceptada · **Fecha:** 2026-08-08

## Contexto

Tecni ya opera con Siigo Nube Pro como su ERP: ahí vive la contabilidad,
los consecutivos de cotización y el precio autorizado de cada producto.
Al mismo tiempo, la plataforma web necesita contenido rico por producto
(fotos, especificaciones por categoría, manuales, comparador) que un ERP
no está diseñado para manejar bien.

Hacía falta decidir dónde vive la verdad de cada dato: ¿el catálogo se
sincroniza desde Siigo, o Siigo se sincroniza desde la web?

## Decisión

**Modelo híbrido con una responsabilidad por sistema:**

- **La web es dueña del catálogo.** El master crea y edita productos
  (nombre, fotos, especificaciones, categoría, manuales) directamente en
  el panel maestro.
- **Siigo es la fuente de verdad del precio.** Se sincroniza por código
  de producto (SKU). Si Siigo no responde, se usa el último precio
  cacheado y se marca explícitamente como "precio sujeto a confirmación"
  — nunca se oculta la incertidumbre.
- **Las cotizaciones se crean en Siigo**, no en la web. La web las
  muestra en el dashboard del cliente y del vendedor; no genera
  consecutivos propios.

## Consecuencias

**Positivas**
- La contabilidad y los consecutivos siguen siendo responsabilidad de
  una sola fuente (Siigo), sin duplicidad ni riesgo de descuadre.
- El catálogo puede tener contenido rico sin pelear con las limitaciones
  de un ERP para eso.
- El fallback a precio cacheado evita que una caída de Siigo tumbe el
  catálogo completo.

**Negativas / costo asumido**
- Un producto sin SKU válido en Siigo no muestra precio — hay que
  mantener la correspondencia SKU↔producto disciplinadamente.
- Dos sistemas que sincronizar significa una superficie más de fallo;
  se compensa con el modo `fallback` documentado y obligatorio en
  `packages/integrations` (ver ADR-0002 y `01-ARCHITECTURE.md` sección 3).
- El vendedor cotiza en Siigo, no en la web — un cambio de flujo de
  trabajo para el equipo comercial que debe comunicarse antes de la
  Fase 3.

## Alternativas descartadas

- **La web genera y sincroniza sus propias cotizaciones/consecutivos
  hacia Siigo:** duplicaría la fuente de verdad contable y arriesgaría
  descuadres. Descartado.
- **El catálogo se sincroniza completo desde Siigo:** el ERP no maneja
  bien fotos, specs por categoría ni manuales — habría producido un
  catálogo pobre. Descartado.
