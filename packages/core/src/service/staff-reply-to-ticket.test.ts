import { describe, expect, it } from "vitest";

import { staffReplyToTicket } from "./staff-reply-to-ticket";

function makeFakeClient(options: { error?: unknown } = {}) {
  const inserted: Record<string, unknown>[] = [];
  const client = {
    from(table: string) {
      if (table !== "ticket_messages") throw new Error(`tabla inesperada: ${table}`);
      return {
        insert: (values: Record<string, unknown>) => ({
          select: () => ({
            single: async () => {
              inserted.push(values);
              return options.error ? { data: null, error: options.error } : { data: { id: "message-1" }, error: null };
            },
          }),
        }),
      };
    },
  };
  return { client, inserted };
}

describe("staffReplyToTicket", () => {
  it("inserta un mensaje público cuando isInternal es false", async () => {
    const { client, inserted } = makeFakeClient();

    await staffReplyToTicket(client as never, { ticketId: "ticket-1", body: "Ya lo revisamos", isInternal: false }, { staffId: "tech-1" });

    expect(inserted[0]).toMatchObject({ is_internal: false, author_id: "tech-1" });
  });

  it("inserta una nota interna cuando isInternal es true", async () => {
    const { client, inserted } = makeFakeClient();

    await staffReplyToTicket(client as never, { ticketId: "ticket-1", body: "Revisar antes de responder", isInternal: true }, { staffId: "tech-1" });

    expect(inserted[0]).toMatchObject({ is_internal: true });
  });

  it("rechaza un mensaje vacío", async () => {
    const { client, inserted } = makeFakeClient();

    await expect(
      staffReplyToTicket(client as never, { ticketId: "ticket-1", body: " ", isInternal: false }, { staffId: "tech-1" }),
    ).rejects.toThrow("El mensaje no puede estar vacío.");
    expect(inserted).toHaveLength(0);
  });
});
