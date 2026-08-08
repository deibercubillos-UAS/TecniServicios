/**
 * packages/ui — design system reutilizable.
 *
 * Componentes visuales puros, sin lógica de negocio ni llamadas a datos,
 * consumiendo exclusivamente los tokens de docs/02-DESIGN-SYSTEM.md (ver
 * docs/01-ARCHITECTURE.md sección 3). Primeros componentes extraídos al
 * migrar la home desde Stitch (docs/17-STITCH-MIGRATION.md, Fase 2 paso 6.2).
 */
export const UI_PACKAGE_NAME = "@tecni/ui";

export { Icon, type IconName } from "./icon";
export { Button, type ButtonProps } from "./button";
export { Badge } from "./badge";
export { StatItem } from "./stat-item";
export { FeatureCard } from "./feature-card";
export { AudienceCard } from "./audience-card";
export { CategoryChip } from "./category-chip";
export { TrustItem } from "./trust-item";
