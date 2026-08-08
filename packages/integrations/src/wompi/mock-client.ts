import { computeWompiChecksum } from "./checksum";
import type { WompiClient, WompiTransaction, WompiWebhookEvent } from "./types";

/** Hash FNV-1a de 32 bits — determinístico, sin dependencias (mismo patrón
 * que SiigoMockClient). */
function hashString(value: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/**
 * Simula Wompi para desarrollar y probar sin credenciales reales
 * (docs/09-INTEGRATION-PAYMENTS.md sección 5 — Wompi sigue
 * `PENDIENTE-DECISIÓN`). Mismo contrato que tendrá el cliente real, sin
 * llamadas de red. `simulateApprovedEvent` firma el payload de verdad con
 * el `eventsSecret` recibido — permite probar la ruta del webhook completa
 * (incluida la verificación de firma) sin desactivarla en ningún punto.
 */
export class WompiMockClient implements WompiClient {
  constructor(private readonly eventsSecret: string) {}

  async createTransaction(reference: string, amountCop: number): Promise<WompiTransaction> {
    const id = `mock_${hashString(reference).toString(16)}`;
    return {
      id,
      reference,
      amountInCents: Math.round(amountCop * 100),
      currency: "COP",
      status: "PENDING",
    };
  }

  simulateApprovedEvent(reference: string, amountCop: number): WompiWebhookEvent {
    const transaction: WompiTransaction = {
      id: `mock_${hashString(reference).toString(16)}`,
      reference,
      amountInCents: Math.round(amountCop * 100),
      currency: "COP",
      status: "APPROVED",
    };
    const timestamp = Date.now();
    const checksum = computeWompiChecksum(transaction, timestamp, this.eventsSecret);
    return {
      event: "transaction.updated",
      data: { transaction },
      timestamp,
      signature: { checksum, properties: ["transaction.id", "transaction.status", "transaction.amount_in_cents"] },
    };
  }
}
