import { describe, expect, it } from "vitest";

import { updateTicketStatus } from "./update-ticket-status";

function makeFakeClient(options: { error?: unknown } = {}) {
  const updates: Record<string, unknown>[] = [];
  const client = {
    from(table: string) {
      if (table !== "support_tickets") throw new Error(`tabla inesperada: ${table}`);
      return {
        update: (values: Record<string, unknown>) => ({
          eq: () => ({
            select: () => ({
              single: async () => {
                updates.push(values);
                return options.error ? { data: null, error: options.error } : { data: { id: "ticket-1" }, error: null };
              },
            }),
          }),
        }),
      };
    },
  };
  return { client, updates };
}

describe("updateTicketStatus", () => {
  it("actualiza el estado sin resolved_at cuando no es resolved", async () => {
    const { client, updates } = makeFakeClient();

    const result = await updateTicketStatus(client as never, "ticket-1", "assigned");

    expect(result.ticketId).toBe("ticket-1");
    expect(updates[0]).toEqual({ status: "assigned" });
  });

  it("marca resolved_at al pasar a resolved", async () => {
    const { client, updates } = makeFakeClient();

    await updateTicketStatus(client as never, "ticket-1", "resolved");

    expect(updates[0]?.["status"]).toBe("resolved");
    expect(typeof updates[0]?.["resolved_at"]).toBe("string");
  });

  it("rechaza un estado inválido sin llegar a la base", async () => {
    const { client, updates } = makeFakeClient();

    await expect(updateTicketStatus(client as never, "ticket-1", "requested")).rejects.toThrow("Estado de ticket inválido.");
    expect(updates).toHaveLength(0);
  });

  it("propaga un error si la base rechaza el update (p. ej. seller sin permiso)", async () => {
    const { client } = makeFakeClient({ error: { message: "denied" } });

    await expect(updateTicketStatus(client as never, "ticket-1", "closed")).rejects.toThrow("No se pudo actualizar el estado del ticket.");
  });
});
