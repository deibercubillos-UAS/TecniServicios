"use server";

import { headers, cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient, createServiceRoleClient } from "@tecni/db";
import { registerUser } from "@tecni/core";
import { registerSchema, DATA_POLICY_VERSION, serverEnv } from "@tecni/shared";

export async function registerAction(formData: FormData): Promise<void> {
  const parsed = registerSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    phone: formData.get("phone") || undefined,
    documentType: "NIT",
    documentNumber: formData.get("documentNumber"),
    companyLegalName: formData.get("companyLegalName") || undefined,
    acceptsDataConsent: formData.get("acceptsDataConsent") === "on",
  });

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Datos inválidos.";
    redirect(`/registro?error=${encodeURIComponent(message)}`);
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
  const serviceClient = createServiceRoleClient(
    serverEnv.NEXT_PUBLIC_SUPABASE_URL,
    serverEnv.SUPABASE_SERVICE_ROLE_KEY,
  );

  const headerList = await headers();
  const ip = headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;

  try {
    await registerUser(authClient, serviceClient, parsed.data, {
      ip,
      policyVersion: DATA_POLICY_VERSION,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudo completar el registro.";
    redirect(`/registro?error=${encodeURIComponent(message)}`);
  }

  redirect("/verificar");
}
