export interface CartItemForSplit {
  productId: string;
  quantity: number;
  unitPriceCop: number;
}

export interface CartSplitResult<T extends CartItemForSplit> {
  directItems: T[];
  quoteItems: T[];
}

/**
 * Divide el carrito según el umbral de cotización (docs/13-MODULE-COMMERCE.md
 * sección 2, regla 5.2 de CLAUDE.md). Compara el **precio del producto**
 * (`unitPriceCop`), no el total de la línea — un producto de $6.000.000 en
 * cantidad 1 va a cotización igual que uno solo, la cantidad no lo saca del
 * umbral. `< thresholdCop` → compra directa; `>= thresholdCop` → cotización.
 * Única función que decide esto — la UI nunca compara precios contra el
 * umbral por su cuenta.
 */
export function splitCartByThreshold<T extends CartItemForSplit>(
  items: T[],
  thresholdCop: number,
): CartSplitResult<T> {
  const directItems: T[] = [];
  const quoteItems: T[] = [];
  for (const item of items) {
    if (item.unitPriceCop < thresholdCop) {
      directItems.push(item);
    } else {
      quoteItems.push(item);
    }
  }
  return { directItems, quoteItems };
}
