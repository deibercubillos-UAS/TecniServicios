import type { SiigoClient, SiigoPrice, SiigoProductPage, SiigoStock, SiigoStockStatus } from "./types";

const STOCK_STATUSES: readonly SiigoStockStatus[] = ["in_stock", "low_stock", "out_of_stock"];

/** Hash FNV-1a de 32 bits — determinístico, sin dependencias. */
function hashSku(sku: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < sku.length; i += 1) {
    hash ^= sku.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/**
 * Simula Siigo para desarrollar y probar sin credenciales reales
 * (docs/12-MODULE-CATALOG.md sección 8, docs/08-INTEGRATION-SIIGO.md
 * sigue `PENDIENTE-DECISIÓN`). Mismo contrato que tendrá el cliente real
 * — se reemplaza sin tocar el código que lo consume (`resolvePrice`).
 * Determinístico por `sku`: el mismo SKU siempre da el mismo precio y
 * stock, sin llamadas de red ni estado compartido entre corridas.
 */
export class SiigoMockClient implements SiigoClient {
  async getProductPrice(sku: string): Promise<SiigoPrice | null> {
    if (sku.length === 0) return null;
    const hash = hashSku(sku);
    // Precio entre $50.000 y $50.000.000 COP, redondeado a miles.
    const priceCop = 50_000 + (hash % 50_000) * 1_000;
    return { priceCop, taxRate: 19 };
  }

  async getProductStock(sku: string): Promise<SiigoStock> {
    if (sku.length === 0) return { status: "unknown" };
    const hash = hashSku(`stock:${sku}`);
    const status = STOCK_STATUSES[hash % STOCK_STATUSES.length] ?? "unknown";
    return { status };
  }

  /** El mock no simula un catálogo completo de Siigo — siempre "sin más
   * páginas", nunca descubre SKU nuevos por sí solo. */
  async listProducts(_page: number): Promise<SiigoProductPage> {
    return { products: [], hasMore: false };
  }
}
