/** Mismas pestañas del navbar (`components/site-header.tsx` → NAV_LINKS)
 * más el inicio — lista fija de páginas reales para el selector de enlace
 * de banners. Si se agrega una pestaña nueva al navbar, se agrega acá. */
export const SITE_PAGES = [
  { value: "/", label: "Inicio" },
  { value: "/catalogo", label: "Catálogo" },
  { value: "/contacto", label: "Contáctanos" },
  { value: "/blog", label: "Blog" },
  { value: "/calcula-tu-rentabilidad", label: "Calcula tu rentabilidad" },
] as const;
