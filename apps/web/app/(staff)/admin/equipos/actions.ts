"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createServerClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";
import { setMaintenanceInterval } from "@tecni/core";

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
    redirect("/login?next=/admin/equipos");
  }
  return client;
}

export async function setMaintenanceIntervalAction(formData: FormData): Promise<void> {
  const equipmentId = String(formData.get("equipmentId") ?? "");
  if (!equipmentId) {
    redirect("/admin/equipos?error=" + encodeURIComponent("Equipo inválido."));
  }

  const monthsRaw = String(formData.get("months") ?? "").trim();
  const months = monthsRaw === "" ? null : Number.parseInt(monthsRaw, 10);

  const client = await getSessionClient();

  try {
    await setMaintenanceInterval(client, equipmentId, months);
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudo guardar el intervalo.";
    redirect("/admin/equipos?error=" + encodeURIComponent(message));
  }

  revalidatePath("/admin/equipos");
  redirect("/admin/equipos?updated=1");
}
