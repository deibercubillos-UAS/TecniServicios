/**
 * packages/integrations — un cliente por servicio externo (Siigo, Wompi,
 * Resend, R2), cada uno con timeout explícito, reintentos con backoff, un
 * modo fallback documentado y errores tipados (ver docs/01-ARCHITECTURE.md
 * sección 3).
 */
export const INTEGRATIONS_PACKAGE_NAME = "@tecni/integrations";

export { SiigoMockClient } from "./siigo/mock-client";
export type { SiigoClient, SiigoPrice, SiigoStock, SiigoStockStatus } from "./siigo/types";

export { WompiMockClient } from "./wompi/mock-client";
export { computeWompiChecksum } from "./wompi/checksum";
export { WOMPI_DEV_EVENTS_SECRET } from "./wompi/dev-secret";
export type {
  WompiClient,
  WompiTransaction,
  WompiTransactionStatus,
  WompiWebhookEvent,
} from "./wompi/types";
