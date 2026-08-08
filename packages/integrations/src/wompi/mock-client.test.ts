import { describe, expect, it } from "vitest";
import { computeWompiChecksum } from "./checksum";
import { WompiMockClient } from "./mock-client";

const SECRET = "test-events-secret";

describe("WompiMockClient", () => {
  it("createTransaction es determinístico por referencia", async () => {
    const client = new WompiMockClient(SECRET);
    const a = await client.createTransaction("ORD-1", 119000);
    const b = await client.createTransaction("ORD-1", 119000);
    expect(a.id).toBe(b.id);
    expect(a.status).toBe("PENDING");
  });

  it("referencias distintas dan transacciones distintas", async () => {
    const client = new WompiMockClient(SECRET);
    const a = await client.createTransaction("ORD-1", 119000);
    const b = await client.createTransaction("ORD-2", 119000);
    expect(a.id).not.toBe(b.id);
  });

  it("convierte pesos a centavos", async () => {
    const client = new WompiMockClient(SECRET);
    const tx = await client.createTransaction("ORD-3", 119000);
    expect(tx.amountInCents).toBe(11_900_000);
  });

  it("simulateApprovedEvent produce una firma verificable con el mismo secreto", () => {
    const client = new WompiMockClient(SECRET);
    const event = client.simulateApprovedEvent("ORD-4", 250000);
    expect(event.data.transaction.status).toBe("APPROVED");
    const recomputed = computeWompiChecksum(event.data.transaction, event.timestamp, SECRET);
    expect(event.signature.checksum).toBe(recomputed);
  });

  it("la firma no valida con un secreto distinto", () => {
    const client = new WompiMockClient(SECRET);
    const event = client.simulateApprovedEvent("ORD-5", 100000);
    const recomputed = computeWompiChecksum(event.data.transaction, event.timestamp, "otro-secreto");
    expect(event.signature.checksum).not.toBe(recomputed);
  });
});
