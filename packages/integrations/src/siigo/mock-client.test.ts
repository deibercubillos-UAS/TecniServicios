import { describe, expect, it } from "vitest";
import { SiigoMockClient } from "./mock-client";

describe("SiigoMockClient", () => {
  it("es determinístico: el mismo sku da siempre el mismo precio y stock", async () => {
    const client = new SiigoMockClient();
    const priceA = await client.getProductPrice("SKU-ABC-123");
    const priceB = await client.getProductPrice("SKU-ABC-123");
    expect(priceA).toEqual(priceB);

    const stockA = await client.getProductStock("SKU-ABC-123");
    const stockB = await client.getProductStock("SKU-ABC-123");
    expect(stockA).toEqual(stockB);
  });

  it("skus distintos dan precios distintos (no una constante)", async () => {
    const client = new SiigoMockClient();
    const priceA = await client.getProductPrice("SKU-AAA-111");
    const priceB = await client.getProductPrice("SKU-BBB-222");
    expect(priceA?.priceCop).not.toBe(priceB?.priceCop);
  });

  it("precio siempre en el rango documentado y con IVA del 19%", async () => {
    const client = new SiigoMockClient();
    const price = await client.getProductPrice("SKU-RANGE-TEST");
    expect(price).not.toBeNull();
    expect(price?.priceCop).toBeGreaterThanOrEqual(50_000);
    expect(price?.priceCop).toBeLessThanOrEqual(50_000_000);
    expect(price?.taxRate).toBe(19);
  });

  it("sku vacío devuelve null en precio y 'unknown' en stock", async () => {
    const client = new SiigoMockClient();
    expect(await client.getProductPrice("")).toBeNull();
    expect(await client.getProductStock("")).toEqual({ status: "unknown" });
  });
});
