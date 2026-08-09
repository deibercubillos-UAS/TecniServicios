"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient, createServiceRoleClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";
import { uploadShipment, markOrderDelivered } from "@tecni/core";

export async function uploadShipmentAction(formData: FormData): Promise<void> {
  const orderNumber = formData.get("orderNumber");
  const orderId = formData.get("orderId");
  const carrier = formData.get("carrier");
  const trackingNumber = formData.get("trackingNumber");
  const trackingUrl = formData.get("trackingUrl");
  const notes = formData.get("notes");

  if (typeof orderNumber !== "string" || typeof orderId !== "string" || typeof carrier !== "string") {
    redirect("/ventas/pedidos?error=" + encodeURIComponent("Datos inválidos."));
  }

  const cookieStore = await cookies();
  const client = createServerClient(serverEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    getAll: () => cookieStore.getAll(),
    setAll: (list) => {
      for (const { name, value, options } of list) {
        cookieStore.set(name, value, options);
      }
    },
  });

  const { data: userData } = await client.auth.getUser();
  if (!userData.user) {
    redirect("/login?next=/ventas/pedidos/" + encodeURIComponent(orderNumber));
  }

  try {
    await uploadShipment(
      client,
      {
        orderId,
        carrier,
        ...(typeof trackingNumber === "string" ? { trackingNumber } : {}),
        ...(typeof trackingUrl === "string" ? { trackingUrl } : {}),
        ...(typeof notes === "string" ? { notes } : {}),
      },
      { userId: userData.user.id },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudo registrar la guía de envío.";
    redirect(`/ventas/pedidos/${encodeURIComponent(orderNumber)}?error=` + encodeURIComponent(message));
  }

  redirect(`/ventas/pedidos/${encodeURIComponent(orderNumber)}?shipped=1`);
}

/** Marca el pedido entregado y genera `owned_equipment` de los productos
 * serializados (14-MODULE-SERVICE.md sección 2). */
export async function markOrderDeliveredAction(formData: FormData): Promise<void> {
  const orderNumber = formData.get("orderNumber");
  const orderId = formData.get("orderId");

  if (typeof orderNumber !== "string" || typeof orderId !== "string") {
    redirect("/ventas/pedidos?error=" + encodeURIComponent("Datos inválidos."));
  }

  const cookieStore = await cookies();
  const client = createServerClient(serverEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    getAll: () => cookieStore.getAll(),
    setAll: (list) => {
      for (const { name, value, options } of list) {
        cookieStore.set(name, value, options);
      }
    },
  });

  const { data: userData } = await client.auth.getUser();
  if (!userData.user) {
    redirect("/login?next=/ventas/pedidos/" + encodeURIComponent(orderNumber));
  }

  const serviceClient = createServiceRoleClient(serverEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv.SUPABASE_SERVICE_ROLE_KEY);

  try {
    await markOrderDelivered(client, serviceClient, orderId, { userId: userData.user.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudo marcar el pedido como entregado.";
    redirect(`/ventas/pedidos/${encodeURIComponent(orderNumber)}?error=` + encodeURIComponent(message));
  }

  redirect(`/ventas/pedidos/${encodeURIComponent(orderNumber)}?delivered=1`);
}
