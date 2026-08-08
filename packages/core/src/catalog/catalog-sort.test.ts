import { describe, expect, it } from "vitest";
import { getAllowedCatalogSorts, isCatalogSortAllowed } from "./catalog-sort";

describe("getAllowedCatalogSorts", () => {
  it("omite 'relevance' sin búsqueda activa", () => {
    expect(getAllowedCatalogSorts(false)).toEqual(["name", "newest"]);
  });

  it("incluye 'relevance' con búsqueda activa", () => {
    expect(getAllowedCatalogSorts(true)).toEqual(["relevance", "name", "newest"]);
  });

  it("nunca incluye una opción de precio, con o sin búsqueda", () => {
    expect(getAllowedCatalogSorts(true)).not.toContain("price");
    expect(getAllowedCatalogSorts(false)).not.toContain("price");
  });
});

describe("isCatalogSortAllowed", () => {
  it("rechaza 'relevance' sin búsqueda activa", () => {
    expect(isCatalogSortAllowed("relevance", false)).toBe(false);
  });

  it("acepta 'name' siempre", () => {
    expect(isCatalogSortAllowed("name", false)).toBe(true);
  });

  it("rechaza valores desconocidos", () => {
    expect(isCatalogSortAllowed("price", true)).toBe(false);
  });
});
