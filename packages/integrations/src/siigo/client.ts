import type { SiigoClient, SiigoPrice, SiigoProductPage, SiigoProductSummary, SiigoStock, SiigoStockStatus } from "./types";

export interface SiigoConfig {
  username: string;
  accessKey: string;
  baseUrl: string;
  partnerId: string;
}

const REQUEST_TIMEOUT_MS = 10_000;
const MAX_RETRIES = 3;
const TOKEN_REFRESH_MARGIN_MS = 5 * 60 * 1000;

interface SiigoAuthResponse {
  access_token: string;
  expires_in?: number;
}

interface SiigoProductRecord {
  code: string;
  name?: string;
  available_quantity?: number;
  prices?: Array<{
    price_list: Array<{ value: number }>;
  }>;
  taxes?: Array<{ percentage: number }>;
}

interface SiigoProductResponse {
  results: SiigoProductRecord[];
}

interface SiigoProductListResponse {
  pagination?: { page: number; page_size: number; total_results: number };
  results: SiigoProductRecord[];
}

const LIST_PAGE_SIZE = 100;

function mapProductRecord(record: SiigoProductRecord): SiigoProductSummary {
  return {
    sku: record.code,
    name: record.name ?? record.code,
    priceCop: record.prices?.[0]?.price_list?.[0]?.value ?? null,
    taxRate: record.taxes?.[0]?.percentage ?? 19,
    stockStatus: mapStockStatus(record.available_quantity),
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function fetchWithRetry(url: string, init: RequestInit): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt += 1) {
    try {
      const response = await fetchWithTimeout(url, init);
      if (response.status >= 500 && attempt < MAX_RETRIES - 1) {
        await sleep(2 ** attempt * 500);
        continue;
      }
      return response;
    } catch (err) {
      lastError = err;
      if (attempt < MAX_RETRIES - 1) {
        await sleep(2 ** attempt * 500);
      }
    }
  }
  throw new Error(`Siigo no respondió tras ${MAX_RETRIES} intentos: ${String(lastError)}`);
}

function mapStockStatus(availableQuantity: number | undefined): SiigoStockStatus {
  if (availableQuantity === undefined) return "unknown";
  if (availableQuantity <= 0) return "out_of_stock";
  if (availableQuantity <= 5) return "low_stock";
  return "in_stock";
}

/**
 * Cliente real de Siigo API (docs/08-INTEGRATION-SIIGO.md). El token se
 * cachea en memoria del proceso y se refresca 5 minutos antes de expirar
 * (sección 2, "Reglas de implementación") — nunca se pide un token nuevo en
 * cada llamada. `getProductPrice` devuelve `null` cuando Siigo no reconoce
 * el SKU (404), nunca lanza para ese caso — lanza solo ante errores de red
 * o de servidor, que sí deben propagarse para que `resolvePrice` (core)
 * decida mostrar "precio sujeto a confirmación" en vez de asumir silencio.
 */
export class SiigoRealClient implements SiigoClient {
  private token: string | null = null;
  private tokenExpiresAt = 0;

  constructor(private readonly config: SiigoConfig) {}

  private async getToken(): Promise<string> {
    if (this.token && Date.now() < this.tokenExpiresAt - TOKEN_REFRESH_MARGIN_MS) {
      return this.token;
    }

    const response = await fetchWithRetry(`${this.config.baseUrl}/auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: this.config.username,
        access_key: this.config.accessKey,
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(`Siigo /auth respondió ${response.status}: ${body}`);
    }

    const data = (await response.json()) as SiigoAuthResponse;
    this.token = data.access_token;
    this.tokenExpiresAt = Date.now() + (data.expires_in ?? 24 * 60 * 60) * 1000;
    return this.token;
  }

  private async authorizedFetch(path: string): Promise<Response> {
    const token = await this.getToken();
    return fetchWithRetry(`${this.config.baseUrl}${path}`, {
      method: "GET",
      headers: {
        Authorization: token,
        "Partner-Id": this.config.partnerId,
      },
    });
  }

  private async findProductByCode(sku: string): Promise<SiigoProductResponse["results"][number] | null> {
    if (sku.length === 0) return null;

    const response = await this.authorizedFetch(`/v1/products?code=${encodeURIComponent(sku)}`);

    if (response.status === 404) return null;
    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(`Siigo /v1/products respondió ${response.status}: ${body}`);
    }

    const data = (await response.json()) as SiigoProductResponse;
    return data.results[0] ?? null;
  }

  async getProductPrice(sku: string): Promise<SiigoPrice | null> {
    const product = await this.findProductByCode(sku);
    if (!product) return null;

    const priceCop = product.prices?.[0]?.price_list?.[0]?.value;
    if (priceCop === undefined) return null;

    const taxRate = product.taxes?.[0]?.percentage ?? 19;
    return { priceCop, taxRate };
  }

  async getProductStock(sku: string): Promise<SiigoStock> {
    const product = await this.findProductByCode(sku);
    if (!product) return { status: "unknown" };
    return { status: mapStockStatus(product.available_quantity) };
  }

  /** Página completa del catálogo de Siigo (docs/08-INTEGRATION-SIIGO.md
   * sección 2.1) — habilita detectar SKU que Siigo tiene y la web no. */
  async listProducts(page: number): Promise<SiigoProductPage> {
    const response = await this.authorizedFetch(`/v1/products?page=${page}&page_size=${LIST_PAGE_SIZE}`);

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(`Siigo /v1/products (listado) respondió ${response.status}: ${body}`);
    }

    const data = (await response.json()) as SiigoProductListResponse;
    const products = data.results.map(mapProductRecord);
    const totalResults = data.pagination?.total_results ?? products.length;
    const pageSize = data.pagination?.page_size ?? LIST_PAGE_SIZE;
    const hasMore = page * pageSize < totalResults;

    return { products, hasMore };
  }
}
