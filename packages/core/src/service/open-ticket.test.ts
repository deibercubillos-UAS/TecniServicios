import { describe, expect, it } from "vitest";

import { openTicket } from "./open-ticket";

function makeFakeClient(options: { ticketError?: unknown; messageError?: unknown } = {}) {
  const insertedTickets: Record<string, unknown>[] = [];
  const insertedMessages: Record<string, unknown>[] = [];
  const client = {
    from(table: string) {
      if (table === "support_tickets") {
        return {
          insert: (values: Record<string, unknown>) => ({
            select: () => ({
              single: async () => {
                insertedTickets.push(values);
                return options.ticketError ? { data: null, error: options.ticketError } : { data: { id: "ticket-1" }, error: null };
              },
            }),
          }),
        };
      }
      if (table === "ticket_messages") {
        return {
          insert: async (values: Record<string, unknown>) => {
            insertedMessages.push(values);
            return { error: options.messageError ?? null };
          },
        };
      }
      throw new Error(`tabla inesperada: ${table}`);
    },
  };
  return { client, insertedTickets, insertedMessages };
}

describe("openTicket", () => {
  it("crea el ticket con un ticket_number generado y el mensaje inicial no interno", async () => {
    const { client, insertedTickets, insertedMessages } = makeFakeClient();

    const result = await openTicket(
      client as never,
      { subject: "Falla en equipo", equipmentId: "equipment-1", message: "El motor hace ruido" },
      { companyId: "company-1", userId: "customer-1" },
    );

    expect(result.ticketId).toBe("ticket-1");
    expect(result.ticketNumber).toMatch(/^TCK-/);
    expect(insertedTickets[0]).toMatchObject({ company_id: "company-1", equipment_id: "equipment-1", opened_by: "customer-1" });
    expect(insertedMessages[0]).toMatchObject({ ticket_id: "ticket-1", is_internal: false, body: "El motor hace ruido" });
  });

  it("no inserta mensaje si no viene ninguno", async () => {
    const { client, insertedMessages } = makeFakeClient();

    await openTicket(client as never, { subject: "Duda general" }, { companyId: "company-1", userId: "customer-1" });

    expect(insertedMessages).toHaveLength(0);
  });

  it("rechaza un asunto vacío sin llegar a la base", async () => {
    const { client, insertedTickets } = makeFakeClient();

    await expect(openTicket(client as never, { subject: "   " }, { companyId: "company-1", userId: "customer-1" })).rejects.toThrow(
      "El asunto es obligatorio.",
    );
    expect(insertedTickets).toHaveLength(0);
  });

  it("propaga un error si la base rechaza el insert", async () => {
    const { client } = makeFakeClient({ ticketError: { message: "denied" } });

    await expect(openTicket(client as never, { subject: "x" }, { companyId: "company-1", userId: "customer-1" })).rejects.toThrow(
      "No se pudo abrir el ticket.",
    );
  });
});
