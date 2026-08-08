/** Selección del comparador: vive solo en el cliente (localStorage), nunca
 * persiste en la base (docs/12-MODULE-CATALOG.md sección 7). Máximo 3
 * productos, todos de la misma categoría — agregar uno de otra categoría
 * reemplaza la selección completa por ese producto solo. */
const STORAGE_KEY = "tecni_compare";
export const MAX_COMPARE = 3;
export const COMPARE_CHANGED_EVENT = "tecni-compare-changed";

export interface CompareItem {
  id: string;
  categoryId: string;
}

function readRaw(): CompareItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is CompareItem =>
        typeof item === "object" && item !== null && typeof (item as CompareItem).id === "string" && typeof (item as CompareItem).categoryId === "string",
    );
  } catch {
    return [];
  }
}

function writeRaw(items: CompareItem[]): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(COMPARE_CHANGED_EVENT));
}

export function getCompareList(): CompareItem[] {
  return readRaw();
}

export function isInCompareList(id: string): boolean {
  return readRaw().some((item) => item.id === id);
}

export function toggleCompareItem(item: CompareItem): CompareItem[] {
  const current = readRaw();
  if (current.some((i) => i.id === item.id)) {
    const next = current.filter((i) => i.id !== item.id);
    writeRaw(next);
    return next;
  }
  const sameCategory = current.filter((i) => i.categoryId === item.categoryId);
  const next = sameCategory.length === current.length ? current : [];
  if (next.length >= MAX_COMPARE) return next;
  const updated = [...next, item];
  writeRaw(updated);
  return updated;
}

export function clearCompareList(): void {
  writeRaw([]);
}
