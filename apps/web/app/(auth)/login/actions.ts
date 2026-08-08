"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@tecni/db";
import { loginSchema, serverEnv } from "@tecni/shared";

/** Nunca revela si el correo existe o no (docs/tasks plan, paso 8.2) —
 * mismo mensaje para credenciales inválidas y correo inexistente. */
const GENERIC_ERROR = "Correo o contraseña incorrectos.";

function safeNext(next: FormDataEntryValue | null): string {
  if (typeof next !== "string" || next.length === 0) return "/";
  if (!next.startsWith("/") || next.startsWith("//")) return "/";
  return next;
}

export async function loginAction(formData: FormData): Promise<void> {
  const next = safeNext(formData.get("next"));

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    redirect(`/login?error=${encodeURIComponent(GENERIC_ERROR)}&next=${encodeURIComponent(next)}`);
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

  const { error } = await authClient.auth.signInWithPassword(parsed.data);

  if (error) {
    if (error.message.toLowerCase().includes("email not confirmed")) {
      redirect("/verificar");
    }
    redirect(`/login?error=${encodeURIComponent(GENERIC_ERROR)}&next=${encodeURIComponent(next)}`);
  }

  redirect(next);
}
