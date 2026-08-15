/** Set fijo de íconos para la franja de anuncio — debe calzar exactamente
 * con `ALLOWED_ANNOUNCEMENT_ICONS` en `packages/core/src/content/manage-banner.ts`.
 * La franja es una línea angosta, sin espacio para imagen ni para elegir
 * entre decenas de íconos. */
export const ANNOUNCEMENT_ICON_OPTIONS = [
  { value: "bolt", label: "Oferta" },
  { value: "truck", label: "Envío" },
  { value: "star", label: "Destacado" },
  { value: "shield", label: "Garantía" },
  { value: "phone", label: "Contacto" },
] as const;
