export interface SiigoPrice {
  priceCop: number;
  taxRate: number;
}

export type SiigoStockStatus = "in_stock" | "low_stock" | "out_of_stock" | "unknown";

export interface SiigoStock {
  status: SiigoStockStatus;
}

export interface SiigoProductSummary {
  sku: string;
  name: string;
  priceCop: number | null;
  taxRate: number;
  stockStatus: SiigoStockStatus;
}

export interface SiigoProductPage {
  products: SiigoProductSummary[];
  hasMore: boolean;
}

/** Contrato que va a tener el cliente real (docs/08-INTEGRATION-SIIGO.md).
 * `null` significa "Siigo no reconoce este SKU", no un error de red — esa
 * distinción la necesita `resolvePrice` en packages/core (Fase 5.2) para
 * decidir entre "sin precio" y "precio no disponible ahora".
 *
 * `listProducts` habilita el descubrimiento de SKU nuevos (sección 2.1):
 * `SiigoMockClient` siempre devuelve una página vacía — el mock no simula
 * un catálogo completo de Siigo, solo respuestas deterministas por SKU
 * conocido. */
export interface SiigoClient {
  getProductPrice(sku: string): Promise<SiigoPrice | null>;
  getProductStock(sku: string): Promise<SiigoStock>;
  listProducts(page: number): Promise<SiigoProductPage>;
}
