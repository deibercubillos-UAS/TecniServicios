"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@tecni/db";
import { submitContactMessage } from "@tecni/core";
import { serverEnv } from "@tecni/shared";

export async function requestDataDeletionAction(formData: FormData): Promise<void> {
  const detail = String(formData.get("detail") ?? "");

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
    redirect("/login?next=/mi-cuenta/privacidad");
  }

  const { data: profileData } = await client.from("profiles").select("full_name").eq("id", userData.user.id).maybeSingle();
  const fullName = (profileData as { full_name: string } | null)?.full_name ?? "Usuario";
  const email = userData.user.email ?? "";

  const message = `Solicitud Ley 1581 — Supresión/anonimización de datos personales. Usuario: ${userData.user.id}.${detail ? ` Detalle: ${detail}` : ""}`;

  try {
    await submitContactMessage(client, { name: fullName, email, message }, { userId: userData.user.id });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "No se pudo enviar la solicitud.";
    redirect(`/mi-cuenta/privacidad?error=${encodeURIComponent(errorMessage)}`);
  }

  redirect("/mi-cuenta/privacidad?sent=1");
}
