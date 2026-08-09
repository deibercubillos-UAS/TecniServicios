import type { SupabaseClient } from "@supabase/supabase-js";
import { recordAuditLog } from "../audit/record-audit-log";

export interface MarkOrderDeliveredContext {
  userId: string;
}

export interface MarkOrderDeliveredResult {
  equipmentIds: string[];
}

interface OrderItemWithProduct {
  product_id: string;
  quantity: number;
  products: { is_serialized: boolean } | null;
}

/**
 * Marca un pedido como entregado y genera `owned_equipment`
 * (14-MODULE-SERVICE.md sección 2) — una fila por unidad de cada
 * `order_item` de un producto serializado (`products.is_serialized`).
 * Mismo patrón de dos clientes que `acceptQuote` (Fase 3): `client`
 * (la sesión de vendedor/master) hace la actualización de
 * `orders.status` que `orders_update_staff` ya permite; `serviceClient`
 * hace **solo** la creación de `owned_equipment`, porque
 * `owned_equipment_write_master` no deja insertar a `authenticated`
 * salvo `master`.
 *
 * **Desviación deliberada:** el plan original preveía el botón visible
 * solo con `status = 'shipped'`, pero ninguna acción de esta fase mueve
 * un pedido a `preparing`/`shipped` todavía (`uploadShipment` a
 * propósito no toca `status`, ver `checkout.ts` de la Fase 3) — no
 * existe esa UI intermedia. Se acepta cualquier estado previo a
 * `delivered`/`cancelled` (`paid`, `preparing`, `shipped`) para no
 * bloquear la única acción que sí se construye en esta fase.
 */
export async function markOrderDelivered(
  client: SupabaseClient,
  serviceClient: SupabaseClient,
  orderId: string,
  ctx: MarkOrderDeliveredContext,
): Promise<MarkOrderDeliveredResult> {
  const { data: order, error: orderError } = await client
    .from("orders")
    .select("id,company_id,status")
    .eq("id", orderId)
    .maybeSingle();
  if (orderError || !order) {
    throw new Error("No se encontró el pedido.");
  }
  const currentStatus = order["status"] as string;
  if (!["paid", "preparing", "shipped"].includes(currentStatus)) {
    throw new Error("Solo se puede marcar como entregado un pedido pagado, en preparación o enviado.");
  }

  const { data: itemsData, error: itemsError } = await client
    .from("order_items")
    .select("product_id,quantity,products(is_serialized)")
    .eq("order_id", orderId);
  if (itemsError) {
    throw new Error("No se pudieron obtener los productos del pedido.");
  }
  const items = (itemsData as unknown as OrderItemWithProduct[] | null) ?? [];

  const { error: updateError } = await client.from("orders").update({ status: "delivered" }).eq("id", orderId);
  if (updateError) {
    throw new Error("No se pudo marcar el pedido como entregado.");
  }

  const today = new Date().toISOString().slice(0, 10);
  const equipmentRows: { company_id: string; product_id: string; order_id: string; delivered_at: string }[] = [];
  for (const item of items) {
    if (!item.products?.is_serialized) continue;
    for (let i = 0; i < item.quantity; i += 1) {
      equipmentRows.push({
        company_id: order["company_id"] as string,
        product_id: item.product_id,
        order_id: orderId,
        delivered_at: today,
      });
    }
  }

  let equipmentIds: string[] = [];
  if (equipmentRows.length > 0) {
    const { data: inserted, error: insertError } = await serviceClient.from("owned_equipment").insert(equipmentRows).select("id");
    if (insertError || !inserted) {
      throw new Error("El pedido se marcó entregado, pero no se pudo generar el equipo adquirido.");
    }
    equipmentIds = inserted.map((row) => row["id"] as string);
  }

  await recordAuditLog(serviceClient, {
    actorId: ctx.userId,
    action: "order.delivered",
    entity: "order",
    entityId: orderId,
    before: { status: currentStatus },
    after: { status: "delivered" },
  });
  for (const equipmentId of equipmentIds) {
    await recordAuditLog(serviceClient, {
      actorId: ctx.userId,
      action: "equipment.created",
      entity: "owned_equipment",
      entityId: equipmentId,
      after: { order_id: orderId },
    });
  }

  return { equipmentIds };
}
