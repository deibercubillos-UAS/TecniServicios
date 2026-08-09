import { describe, expect, it } from "vitest";

import { confirmMaintenance, rescheduleMaintenance } from "./update-maintenance-status";

function makeFakeClient(options: { error?: unknown } = {}) {
  const updates: Record<string, unknown>[] = [];
  const client = {
    from(table: string) {
      if (table !== "maintenance_requests") throw new Error(`tabla inesperada: ${table}`);
      return {
        update: (values: Record<string, unknown>) => ({
          eq: () => ({
            select: () => ({
              single: async () => {
                updates.push(values);
                return options.error ? { data: null, error: options.error } : { data: { id: "request-1" }, error: null };
              },
            }),
          }),
        }),
      };
    },
  };
  return { client, updates };
}

describe("confirmMaintenance", () => {
  it("marca confirmed con confirmed_at", async () => {
    const { client, updates } = makeFakeClient();

    const result = await confirmMaintenance(client as never, "request-1");

    expect(result.requestId).toBe("request-1");
    expect(updates[0]).toMatchObject({ status: "confirmed" });
    expect(typeof updates[0]?.["confirmed_at"]).toBe("string");
  });

  it("propaga un error si la base rechaza el update (p. ej. técnico ajeno)", async () => {
    const { client } = makeFakeClient({ error: { message: "denied" } });

    await expect(confirmMaintenance(client as never, "request-1")).rejects.toThrow("No se pudo confirmar el mantenimiento.");
  });
});

describe("rescheduleMaintenance", () => {
  it("marca rescheduled con la nueva fecha", async () => {
    const { client, updates } = makeFakeClient();

    const result = await rescheduleMaintenance(client as never, "request-1", "2026-09-15T14:00:00.000Z");

    expect(result.requestId).toBe("request-1");
    expect(updates[0]).toMatchObject({ status: "rescheduled", scheduled_at: "2026-09-15T14:00:00.000Z" });
  });
});
