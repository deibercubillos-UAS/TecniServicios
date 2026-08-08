/**
 * packages/integrations — un cliente por servicio externo (Siigo, Wompi,
 * Resend, R2), cada uno con timeout explícito, reintentos con backoff, un
 * modo fallback documentado y errores tipados (ver docs/01-ARCHITECTURE.md
 * sección 3). Intencionalmente vacío en la Fase 0: los clientes reales se
 * implementan junto con cada integración (docs/08, 09, 10, 11), a partir de
 * la Fase 1.
 */
export const INTEGRATIONS_PACKAGE_NAME = "@tecni/integrations";
