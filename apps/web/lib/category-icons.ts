import type { IconName } from "@tecni/ui";

/** Icono decorativo por categoría real — sin `icon_url` cargado todavía
 * (columna existe, sin dato), se mapea por slug contra el set de íconos
 * disponible en `@tecni/ui`. Puramente visual, no es dato de negocio.
 * Compartido entre el home (carrusel de categorías) y
 * `/catalogo/categoria/[slug]` (página dedicada de categoría) — un solo
 * lugar, no se duplica. */
export const CATEGORY_ICON: Record<string, IconName> = {
  "alineacion-balanceo": "car",
  elevacion: "building",
  diagnostico: "thermostat",
  lubricacion: "drop",
  "insumos-consumibles": "box",
  "herramientas-taller": "wrench",
  desmontadoras: "gear",
  balanceadoras: "sliders",
};
