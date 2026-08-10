"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient, createServiceRoleClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";
import { createMaintenanceAvailability, deleteMaintenanceAvailability } from "@tecni/core";

async function getSessionClient() {
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
    redirect("/login?next=/admin/mantenimientos");
  }
  return { client, userId: userData.user!.id };
}

export async function createMaintenanceAvailabilityAction(formData: FormData): Promise<void> {
  const availableDate = String(formData.get("availableDate") ?? "");
  const maxVisits = Number.parseInt(String(formData.get("maxVisits") ?? ""), 10);
  const notes = String(formData.get("notes") ?? "");

  if (!availableDate || Number.isNaN(maxVisits) || maxVisits <= 0) {
    redirect("/admin/mantenimientos?error=" + encodeURIComponent("Fecha o cupo inválidos."));
  }

  const { client, userId } = await getSessionClient();
  const serviceClient = createServiceRoleClient(serverEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv.SUPABASE_SERVICE_ROLE_KEY);

  try {
    await createMaintenanceAvailability(
      client,
      serviceClient,
      { availableDate, maxVisits, ...(notes ? { notes } : {}) },
      { actorId: userId },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudo abrir la fecha.";
    redirect("/admin/mantenimientos?error=" + encodeURIComponent(message));
  }

  redirect("/admin/mantenimientos?created=1");
}

export async function deleteMaintenanceAvailabilityAction(formData: FormData): Promise<void> {
  const availableDate = String(formData.get("availableDate") ?? "");
  if (!availableDate) {
    redirect("/admin/mantenimientos?error=" + encodeURIComponent("Fecha inválida."));
  }

  const { client, userId } = await getSessionClient();
  const serviceClient = createServiceRoleClient(serverEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv.SUPABASE_SERVICE_ROLE_KEY);

  try {
    await deleteMaintenanceAvailability(client, serviceClient, availableDate, { actorId: userId });
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudo cerrar la fecha.";
    redirect("/admin/mantenimientos?error=" + encodeURIComponent(message));
  }

  redirect("/admin/mantenimientos?deleted=1");
}
