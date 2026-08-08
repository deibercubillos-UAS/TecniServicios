import { describe, expect, it } from "vitest";
import { splitCartByThreshold } from "./split-cart-by-threshold";

const THRESHOLD = 5_000_000;

describe("splitCartByThreshold", () => {
  it("un producto bajo el umbral va a compra directa", () => {
    const items = [{ productId: "a", quantity: 1, unitPriceCop: 4_999_999 }];
    const result = splitCartByThreshold(items, THRESHOLD);
    expect(result.directItems).toHaveLength(1);
    expect(result.quoteItems).toHaveLength(0);
  });

  it("un producto exactamente en el umbral va a cotización (>=)", () => {
    const items = [{ productId: "a", quantity: 1, unitPriceCop: 5_000_000 }];
    const result = splitCartByThreshold(items, THRESHOLD);
    expect(result.directItems).toHaveLength(0);
    expect(result.quoteItems).toHaveLength(1);
  });

  it("un producto sobre el umbral va a cotización", () => {
    const items = [{ productId: "a", quantity: 1, unitPriceCop: 5_000_001 }];
    const result = splitCartByThreshold(items, THRESHOLD);
    expect(result.directItems).toHaveLength(0);
    expect(result.quoteItems).toHaveLength(1);
  });

  it("la cantidad no saca un producto del umbral — compara el precio unitario, no el total de línea", () => {
    // 10 unidades de $600.000 c/u = $6.000.000 de línea, pero cada unidad
    // sigue estando bajo el umbral de $5.000.000 — va a compra directa.
    const items = [{ productId: "a", quantity: 10, unitPriceCop: 600_000 }];
    const result = splitCartByThreshold(items, THRESHOLD);
    expect(result.directItems).toHaveLength(1);
    expect(result.quoteItems).toHaveLength(0);
  });

  it("divide un carrito mixto correctamente", () => {
    const items = [
      { productId: "barato", quantity: 1, unitPriceCop: 100_000 },
      { productId: "caro", quantity: 1, unitPriceCop: 8_000_000 },
      { productId: "medio", quantity: 2, unitPriceCop: 2_000_000 },
    ];
    const result = splitCartByThreshold(items, THRESHOLD);
    expect(result.directItems.map((i) => i.productId)).toEqual(["barato", "medio"]);
    expect(result.quoteItems.map((i) => i.productId)).toEqual(["caro"]);
  });

  it("carrito vacío devuelve ambas listas vacías", () => {
    const result = splitCartByThreshold([], THRESHOLD);
    expect(result.directItems).toEqual([]);
    expect(result.quoteItems).toEqual([]);
  });
});
