export type CatalogSort = "relevance" | "name" | "newest";

const ALWAYS_ALLOWED: CatalogSort[] = ["relevance", "name", "newest"];

/**
 * El precio nunca puede inferirse ordenando el listado (docs/12-MODULE-CATALOG.md
 * sección 4) — por eso "precio" no forma parte de `CatalogSort` en absoluto,
 * ni con sesión. Esta función solo decide si "relevancia" tiene sentido
 * (requiere una búsqueda activa).
 */
export function getAllowedCatalogSorts(hasActiveSearch: boolean): CatalogSort[] {
  return hasActiveSearch ? ALWAYS_ALLOWED : ALWAYS_ALLOWED.filter((s) => s !== "relevance");
}

export function isCatalogSortAllowed(sort: string, hasActiveSearch: boolean): sort is CatalogSort {
  return getAllowedCatalogSorts(hasActiveSearch).includes(sort as CatalogSort);
}
