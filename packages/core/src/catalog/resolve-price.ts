export interface ResolvePriceProduct {
  priceCop: number | null;
  priceSyncedAt: string | null;
}

export interface ResolvePriceContext {
  userId: string | null;
}

export type PriceResolution =
  | { visible: false }
  | { visible: true; priceCop: number; confidence: "confirmed" | "unconfirmed" };

const UNCONFIRMED_AFTER_HOURS = 6;
const HIDDEN_AFTER_HOURS = 48;

/**
 * Toda la UI consume esta función, nunca `product.price_cop` directo
 * (docs/05-RLS-SECURITY.md sección 3). Sin sesión, nunca hay precio — RLS
 * ya bloquea el dato a nivel de base, pero esta función es la segunda capa:
 * aunque alguien pase accidentalmente la fila completa, `resolvePrice`
 * decide qué se muestra.
 *
 * Antigüedad del precio según docs/08-INTEGRATION-SIIGO.md sección 2:
 * < 6 horas → normal; 6–48 horas → "sujeto a confirmación"; > 48 horas →
 * se oculta (el criterio pasa a "Solicitar cotización").
 */
export function resolvePrice(
  product: ResolvePriceProduct,
  ctx: ResolvePriceContext,
): PriceResolution {
  if (ctx.userId === null) return { visible: false };
  if (product.priceCop === null || product.priceSyncedAt === null) return { visible: false };

  const syncedAt = new Date(product.priceSyncedAt).getTime();
  if (Number.isNaN(syncedAt)) return { visible: false };

  const ageHours = (Date.now() - syncedAt) / (1000 * 60 * 60);
  if (ageHours > HIDDEN_AFTER_HOURS) return { visible: false };

  const confidence = ageHours > UNCONFIRMED_AFTER_HOURS ? "unconfirmed" : "confirmed";
  return { visible: true, priceCop: product.priceCop, confidence };
}
