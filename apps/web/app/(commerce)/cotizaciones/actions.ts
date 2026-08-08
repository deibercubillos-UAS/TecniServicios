"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient, createServiceRoleClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";
import { acceptQuote } from "@tecni/core";

export async function acceptQuoteAction(formData: FormData): Promise<void> {
  const quoteId = formData.get("quoteId");
  if (typeof quoteId !== "string" || quoteId.length === 0) {
    redirect("/cotizaciones?error=" + encodeURIComponent("Datos inválidos."));
  }

  const cookieStore = await cookies();
  const client = createServerClient(serverEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    getAll: () => cookieStore.getAll(),
    setAll: () => {},
  });

  const { data: userData } = await client.auth.getUser();
  if (!userData.user) {
    redirect("/login?next=/cotizaciones");
  }

  const { data: membership } = await client
    .from("company_members")
    .select("company_id")
    .eq("profile_id", userData.user.id)
    .order("is_primary", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!membership) {
    redirect("/cotizaciones?error=" + encodeURIComponent("Tu cuenta todavía no está asociada a una empresa."));
  }

  const serviceClient = createServiceRoleClient(serverEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv.SUPABASE_SERVICE_ROLE_KEY);

  try {
    await acceptQuote(client, serviceClient, quoteId, {
      userId: userData.user.id,
      companyId: membership["company_id"] as string,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudo aceptar la cotización.";
    redirect("/cotizaciones?error=" + encodeURIComponent(message));
  }

  // El pedido creado se ve desde el panel de pedidos cuando exista
  // (paso 8.1 de esta misma tarea) — por ahora, confirmación en la
  // propia vista de cotizaciones.
  redirect("/cotizaciones?accepted=1");
}
