"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";
import { confirmMaintenance, rescheduleMaintenance, completeMaintenance } from "@tecni/core";

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
    redirect("/login?next=/tecnico/mantenimientos");
  }
  return { client, userId: userData.user.id };
}

export async function confirmMaintenanceAction(formData: FormData): Promise<void> {
  const requestId = formData.get("requestId");
  if (typeof requestId !== "string" || requestId.length === 0) {
    redirect("/tecnico/mantenimientos?error=" + encodeURIComponent("Datos inválidos."));
  }

  const { client } = await getSessionClient();

  try {
    await confirmMaintenance(client, requestId);
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudo confirmar el mantenimiento.";
    redirect("/tecnico/mantenimientos?error=" + encodeURIComponent(message));
  }

  redirect("/tecnico/mantenimientos?confirmed=1");
}

export async function rescheduleMaintenanceAction(formData: FormData): Promise<void> {
  const requestId = formData.get("requestId");
  const scheduledAt = formData.get("scheduledAt");
  if (typeof requestId !== "string" || requestId.length === 0 || typeof scheduledAt !== "string" || scheduledAt.length === 0) {
    redirect("/tecnico/mantenimientos?error=" + encodeURIComponent("Selecciona fecha y hora."));
  }

  const { client } = await getSessionClient();

  try {
    await rescheduleMaintenance(client, requestId, new Date(scheduledAt as string).toISOString());
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudo reprogramar el mantenimiento.";
    redirect("/tecnico/mantenimientos?error=" + encodeURIComponent(message));
  }

  redirect("/tecnico/mantenimientos?rescheduled=1");
}

export async function completeMaintenanceAction(formData: FormData): Promise<void> {
  const requestId = formData.get("requestId");
  const workDone = formData.get("workDone");
  const recommendations = formData.get("recommendations");
  const nextServiceDate = formData.get("nextServiceDate");

  if (typeof requestId !== "string" || requestId.length === 0 || typeof workDone !== "string" || workDone.trim().length === 0) {
    redirect("/tecnico/mantenimientos?error=" + encodeURIComponent("Describe el trabajo realizado."));
  }

  const { client, userId } = await getSessionClient();

  try {
    await completeMaintenance(
      client,
      {
        requestId,
        workDone,
        ...(typeof recommendations === "string" && recommendations.length > 0 ? { recommendations } : {}),
        ...(typeof nextServiceDate === "string" && nextServiceDate.length > 0 ? { nextServiceDate } : {}),
      },
      { technicianId: userId },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudo registrar el reporte.";
    redirect("/tecnico/mantenimientos?error=" + encodeURIComponent(message));
  }

  redirect("/tecnico/mantenimientos?completed=1");
}
