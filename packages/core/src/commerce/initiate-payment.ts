import type { WompiClient } from "@tecni/integrations";

export interface InitiatePaymentOrder {
  orderNumber: string;
  totalCop: number;
}

export interface InitiatePaymentResult {
  transactionId: string;
  reference: string;
}

/**
 * Inicia la transacción de pago de un pedido ya creado en
 * `pending_payment` (docs/09-INTEGRATION-PAYMENTS.md sección 2, paso 2) —
 * la referencia es el `order_number` (único), así el webhook (paso 7.3)
 * puede volver a encontrar el pedido sin depender de nada que Wompi
 * invente. No escribe en `payments`: esa tabla solo la escribe el webhook
 * (`service_role`, docs/05-RLS-SECURITY-A.md), nunca esta función.
 *
 * Recibe el cliente de Wompi ya armado (real o `WompiMockClient`) — así
 * `packages/core` no depende del paquete de integraciones a nivel de
 * import de clase, solo del contrato `WompiClient`.
 */
export async function initiateOrderPayment(
  wompiClient: WompiClient,
  order: InitiatePaymentOrder,
): Promise<InitiatePaymentResult> {
  const transaction = await wompiClient.createTransaction(order.orderNumber, order.totalCop);
  return { transactionId: transaction.id, reference: transaction.reference };
}
