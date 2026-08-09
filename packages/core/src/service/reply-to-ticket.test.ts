import { describe, expect, it } from "vitest";

import { replyToTicket } from "./reply-to-ticket";

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

describe("replyToTicket", () => {
  it("inserta el mensaje siempre no interno", async () => {
    const { client, inserted } = makeFakeClient();

    const result = await replyToTicket(client as never, { ticketId: "ticket-1", body: "Gracias, sigue fallando" }, { userId: "customer-1" });

    expect(result.messageId).toBe("message-1");
    expect(inserted[0]).toMatchObject({ ticket_id: "ticket-1", author_id: "customer-1", body: "Gracias, sigue fallando", is_internal: false });
  });

  it("rechaza un mensaje vacío sin llegar a la base", async () => {
    const { client, inserted } = makeFakeClient();

    await expect(replyToTicket(client as never, { ticketId: "ticket-1", body: "   " }, { userId: "customer-1" })).rejects.toThrow(
      "El mensaje no puede estar vacío.",
    );
    expect(inserted).toHaveLength(0);
  });

  it("propaga un error si la base rechaza el insert (p. ej. ticket ajeno)", async () => {
    const { client } = makeFakeClient({ error: { message: "denied" } });

    await expect(replyToTicket(client as never, { ticketId: "ticket-ajeno", body: "x" }, { userId: "customer-1" })).rejects.toThrow(
      "No se pudo enviar el mensaje.",
    );
  });
});
