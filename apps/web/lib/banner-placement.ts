/** Valores reales de `ALLOWED_BANNER_PLACEMENTS` en
 * `packages/core/src/content/manage-banner.ts`. */
export const BANNER_PLACEMENT_LABEL: Record<string, string> = {
  home_hero: "Home hero",
  catalog_top: "Catálogo (arriba)",
  announcement_bar: "Franja de anuncio (navbar)",
  promotions: "Sección de descuentos",
};

/** Orden y agrupación fija para /admin/banners — una tarjeta por
 * ubicación, en vez de una sola lista plana mezclando todo. */
export const BANNER_PLACEMENT_GROUPS: { placement: string; label: string; description: string }[] = [
  { placement: "home_hero", label: "Banners superiores (Home)", description: "Carrusel al tope de la home." },
  { placement: "announcement_bar", label: "Franja de anuncio", description: "Línea angosta arriba del navbar — título, enlace e ícono, sin imagen." },
  { placement: "promotions", label: "Sección de descuentos", description: "Acompaña la promoción activa en la home." },
  { placement: "catalog_top", label: "Catálogo (arriba)", description: "Sobre la grilla de productos en /catalogo." },
];
