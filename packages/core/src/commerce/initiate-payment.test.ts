import { describe, expect, it } from "vitest";
import { WompiMockClient } from "@tecni/integrations";

import { initiateOrderPayment } from "./initiate-payment";

describe("initiateOrderPayment", () => {
  it("usa el order_number como referencia y devuelve el id de la transacción", async () => {
    const client = new WompiMockClient("test-secret");

    const result = await initiateOrderPayment(client, { orderNumber: "ORD-ABC123", totalCop: 238000 });

    expect(result.reference).toBe("ORD-ABC123");
    expect(result.transactionId).toMatch(/^mock_/);
  });

  it("es determinística: la misma referencia siempre da el mismo id de transacción", async () => {
    const client = new WompiMockClient("test-secret");

    const first = await initiateOrderPayment(client, { orderNumber: "ORD-ABC123", totalCop: 238000 });
    const second = await initiateOrderPayment(client, { orderNumber: "ORD-ABC123", totalCop: 238000 });

    expect(first.transactionId).toBe(second.transactionId);
  });
});
