"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";
import { requestMaintenance } from "@tecni/core";

export async function requestMaintenanceAction(formData: FormData): Promise<void> {
  const equipmentId = formData.get("equipmentId");
  const preferredDate = formData.get("preferredDate");
  const description = formData.get("description");

  if (typeof equipmentId !== "string" || equipmentId.length === 0) {
    redirect("/mi-cuenta/mantenimientos?error=" + encodeURIComponent("Selecciona un equipo."));
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
    redirect("/login?next=/mi-cuenta/mantenimientos");
  }

  const { data: membership } = await client
    .from("company_members")
    .select("company_id")
    .eq("profile_id", userData.user.id)
    .order("is_primary", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!membership) {
    redirect("/mi-cuenta/mantenimientos?error=" + encodeURIComponent("Tu cuenta todavía no está asociada a una empresa."));
  }

  try {
    await requestMaintenance(
      client,
      {
        equipmentId,
        ...(typeof preferredDate === "string" && preferredDate.length > 0 ? { preferredDate } : {}),
        ...(typeof description === "string" && description.length > 0 ? { description } : {}),
      },
      { companyId: membership["company_id"] as string, userId: userData.user.id },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudo solicitar el mantenimiento.";
    redirect("/mi-cuenta/mantenimientos?error=" + encodeURIComponent(message));
  }

  redirect("/mi-cuenta/mantenimientos?created=1");
}
