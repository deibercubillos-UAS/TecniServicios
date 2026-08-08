import { createHash } from "node:crypto";
import type { WompiTransaction } from "./types";

/**
 * Firma del evento de webhook (docs/09-INTEGRATION-PAYMENTS.md sección 4):
 * `sha256(id + status + amountInCents + timestamp + secreto)`, formato real
 * de Wompi (concatena los valores de `signature.properties` en orden, más
 * el timestamp y el secreto). Compartida entre `WompiMockClient` (la
 * calcula al simular un evento) y el webhook real (la recalcula para
 * verificar) — mismo algoritmo en los dos lados, nunca dos implementaciones
 * separadas que puedan divergir.
 */
export function computeWompiChecksum(
  transaction: WompiTransaction,
  timestamp: number,
  eventsSecret: string,
): string {
  const raw = `${transaction.id}${transaction.status}${transaction.amountInCents}${timestamp}${eventsSecret}`;
  return createHash("sha256").update(raw).digest("hex");
}
