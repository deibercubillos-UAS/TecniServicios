"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@tecni/db";
import { submitContactMessage } from "@tecni/core";
import { contactSchema, serverEnv } from "@tecni/shared";

export async function contactAction(formData: FormData): Promise<void> {
  const parsed = contactSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") || undefined,
    message: formData.get("message"),
  });

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Datos inválidos.";
    redirect(`/contacto?error=${encodeURIComponent(message)}`);
  }

  const cookieStore = await cookies();
  const authClient = createServerClient(
    serverEnv.NEXT_PUBLIC_SUPABASE_URL,
    serverEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { getAll: () => cookieStore.getAll(), setAll: () => {} },
  );
  const { data: userData } = await authClient.auth.getUser();

  try {
    await submitContactMessage(authClient, parsed.data, { userId: userData.user?.id ?? null });
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudo enviar el mensaje.";
    redirect(`/contacto?error=${encodeURIComponent(message)}`);
  }

  redirect("/contacto?sent=1");
}
