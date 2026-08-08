"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";

export async function resendVerificationAction(formData: FormData): Promise<void> {
  const email = formData.get("email");
  if (typeof email !== "string" || email.length === 0) {
    redirect("/verificar");
  }

  const cookieStore = await cookies();
  const authClient = createServerClient(
    serverEnv.NEXT_PUBLIC_SUPABASE_URL,
    serverEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      getAll: () => cookieStore.getAll(),
      setAll: (list) => {
        for (const { name, value, options } of list) {
          cookieStore.set(name, value, options);
        }
      },
    },
  );

  const { error } = await authClient.auth.resend({ type: "signup", email });

  if (error) {
    redirect(
      `/verificar?email=${encodeURIComponent(email)}&error=${encodeURIComponent(
        "No se pudo reenviar el correo. Intenta de nuevo en unos minutos.",
      )}`,
    );
  }

  redirect(`/verificar?email=${encodeURIComponent(email)}&sent=1`);
}
