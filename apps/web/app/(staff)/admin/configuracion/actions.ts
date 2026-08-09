"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";
import { updateSetting } from "@tecni/core";

async function getSession() {
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
    redirect("/login?next=/admin/configuracion");
  }
  return { client, userId: userData.user.id };
}

export async function updateSettingAction(formData: FormData): Promise<void> {
  const key = String(formData.get("key") ?? "");
  const rawValue = String(formData.get("value") ?? "");
  if (key.length === 0) {
    redirect("/admin/configuracion?error=" + encodeURIComponent("Clave inválida."));
  }

  const { client, userId } = await getSession();

  let parsedValue: unknown;
  try {
    parsedValue = JSON.parse(rawValue);
  } catch {
    redirect("/admin/configuracion?error=" + encodeURIComponent("El valor debe ser JSON válido (un número va sin comillas)."));
  }

  try {
    await updateSetting(client, key, parsedValue, userId);
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudo actualizar la configuración.";
    redirect("/admin/configuracion?error=" + encodeURIComponent(message));
  }

  redirect("/admin/configuracion?updated=1");
}
