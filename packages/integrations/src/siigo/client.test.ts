import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SiigoRealClient } from "./client";

const CONFIG = {
  username: "sandbox@siigoapi.com",
  accessKey: "test-access-key",
  baseUrl: "https://api.siigo.test",
  partnerId: "tecni-partner-id",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

describe("SiigoRealClient", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("autentica una sola vez y reutiliza el token en llamadas siguientes", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ access_token: "tok-1", expires_in: 3600 }))
      .mockResolvedValueOnce(jsonResponse({ results: [{ code: "SKU-1", prices: [{ price_list: [{ value: 100000 }] }], taxes: [{ percentage: 19 }] }] }))
      .mockResolvedValueOnce(jsonResponse({ results: [{ code: "SKU-2", prices: [{ price_list: [{ value: 200000 }] }], taxes: [{ percentage: 19 }] }] }));

    const client = new SiigoRealClient(CONFIG);
    await client.getProductPrice("SKU-1");
    await client.getProductPrice("SKU-2");

    const authCalls = fetchMock.mock.calls.filter(([url]) => String(url).endsWith("/auth"));
    expect(authCalls).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("SKU inexistente (404) devuelve null, no lanza", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ access_token: "tok-1", expires_in: 3600 }))
      .mockResolvedValueOnce(new Response("not found", { status: 404 }));

    const client = new SiigoRealClient(CONFIG);
    await expect(client.getProductPrice("SKU-INEXISTENTE")).resolves.toBeNull();
  });

  it("SKU vacío nunca llama a la red", async () => {
    const fetchMock = vi.mocked(fetch);
    const client = new SiigoRealClient(CONFIG);
    await expect(client.getProductPrice("")).resolves.toBeNull();
    await expect(client.getProductStock("")).resolves.toEqual({ status: "unknown" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("error 500 de Siigo se propaga (nunca se confunde con SKU inexistente)", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ access_token: "tok-1", expires_in: 3600 }))
      .mockResolvedValue(new Response("server error", { status: 500 }));

    const client = new SiigoRealClient(CONFIG);
    await expect(client.getProductPrice("SKU-1")).rejects.toThrow();
  });

  it("mapea disponibilidad a estado de stock", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ access_token: "tok-1", expires_in: 3600 }))
      .mockResolvedValueOnce(jsonResponse({ results: [{ code: "SKU-1", available_quantity: 0 }] }))
      .mockResolvedValueOnce(jsonResponse({ results: [{ code: "SKU-2", available_quantity: 3 }] }))
      .mockResolvedValueOnce(jsonResponse({ results: [{ code: "SKU-3", available_quantity: 40 }] }));

    const client = new SiigoRealClient(CONFIG);
    expect(await client.getProductStock("SKU-1")).toEqual({ status: "out_of_stock" });
    expect(await client.getProductStock("SKU-2")).toEqual({ status: "low_stock" });
    expect(await client.getProductStock("SKU-3")).toEqual({ status: "in_stock" });
  });
});
