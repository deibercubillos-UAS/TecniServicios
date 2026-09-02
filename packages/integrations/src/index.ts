/**
 * packages/integrations — un cliente por servicio externo (Siigo, Wompi,
 * Resend, R2), cada uno con timeout explícito, reintentos con backoff, un
 * modo fallback documentado y errores tipados (ver docs/01-ARCHITECTURE.md
 * sección 3).
 */
export const INTEGRATIONS_PACKAGE_NAME = "@tecni/integrations";

export { SiigoMockClient } from "./siigo/mock-client";
export { SiigoRealClient } from "./siigo/client";
export type { SiigoConfig } from "./siigo/client";
export { getSiigoClient } from "./siigo/get-client";
export type { SiigoClient, SiigoPrice, SiigoStock, SiigoStockStatus } from "./siigo/types";

export {
  uploadToR2,
  deleteFromR2,
  buildProductAssetKey,
  buildCategoryAssetKey,
  buildBrandAssetKey,
  buildBannerAssetKey,
  buildMaintenanceAssetKey,
  buildAccessoryAssetKey,
  type R2Config,
  type UploadToR2Input,
  type UploadToR2Result,
} from "./r2/client";

export {
  sendMaintenanceReminderEmail,
  type ResendConfig,
  type SendMaintenanceReminderEmailInput,
} from "./resend/client";

export { WompiMockClient } from "./wompi/mock-client";
export { computeWompiChecksum } from "./wompi/checksum";
export { WOMPI_DEV_EVENTS_SECRET } from "./wompi/dev-secret";
export type {
  WompiClient,
  WompiTransaction,
  WompiTransactionStatus,
  WompiWebhookEvent,
} from "./wompi/types";
