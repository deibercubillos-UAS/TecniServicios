export type WompiTransactionStatus = "PENDING" | "APPROVED" | "DECLINED" | "VOIDED" | "ERROR";

export interface WompiTransaction {
  id: string;
  reference: string;
  amountInCents: number;
  currency: string;
  status: WompiTransactionStatus;
}

export interface WompiWebhookEvent {
  event: "transaction.updated";
  data: { transaction: WompiTransaction };
  timestamp: number;
  signature: { checksum: string; properties: string[] };
}

/** Contrato que va a tener el cliente real (docs/09-INTEGRATION-PAYMENTS.md). */
export interface WompiClient {
  createTransaction(reference: string, amountCop: number): Promise<WompiTransaction>;
}
