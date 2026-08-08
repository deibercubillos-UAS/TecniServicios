"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@tecni/db";
import { requestResetSchema, confirmPasswordSchema, serverEnv } from "@tecni/shared";

async function authClientWithCookies() {
  const cookieStore = await cookies();
  return createServerClient(
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
}

async function origin(): Promise<string> {
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  const proto = headerList.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}

/** Siempre redirige al mismo mensaje de éxito, exista o no el correo —
 * mismo principio de no revelar existencia de cuenta que en /login. */
export async function requestResetAction(formData: FormData): Promise<void> {
  const parsed = requestResetSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    redirect(`/recuperar?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Correo inválido")}`);
  }

  const authClient = await authClientWithCookies();
  const base = await origin();

  await authClient.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${base}/auth/callback?next=/recuperar`,
  });

  redirect("/recuperar?sent=1");
}

export async function confirmPasswordAction(formData: FormData): Promise<void> {
  const parsed = confirmPasswordSchema.safeParse({ password: formData.get("password") });
  if (!parsed.success) {
    redirect(`/recuperar?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Contraseña inválida")}`);
  }

  const authClient = await authClientWithCookies();
  const { data: userData } = await authClient.auth.getUser();
  if (!userData.user) {
    redirect(`/recuperar?error=${encodeURIComponent("El enlace expiró o ya se usó. Solicita uno nuevo.")}`);
  }

  const { error } = await authClient.auth.updateUser({ password: parsed.data.password });
  if (error) {
    redirect(`/recuperar?error=${encodeURIComponent("No se pudo actualizar la contraseña. Intenta de nuevo.")}`);
  }

  await authClient.auth.signOut();
  redirect(`/login?message=${encodeURIComponent("Contraseña actualizada. Inicia sesión con la nueva.")}`);
}
