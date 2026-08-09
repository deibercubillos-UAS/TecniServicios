"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@tecni/db";
import { submitContactMessage } from "@tecni/core";
import { confirmPasswordSchema, serverEnv } from "@tecni/shared";

async function getActionClient() {
  const cookieStore = await cookies();
  return createServerClient(serverEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    getAll: () => cookieStore.getAll(),
    setAll: (list) => {
      for (const { name, value, options } of list) {
        cookieStore.set(name, value, options);
      }
    },
  });
}

export async function updateProfileAction(formData: FormData): Promise<void> {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();

  if (fullName.length === 0) {
    redirect("/mi-cuenta/privacidad?error=" + encodeURIComponent("El nombre no puede estar vacío."));
  }

  const client = await getActionClient();
  const { data: userData } = await client.auth.getUser();
  if (!userData.user) {
    redirect("/login?next=/mi-cuenta/privacidad");
  }

  // `profiles_update_self` (docs/05-RLS-SECURITY-A.md) solo deja editar el
  // propio perfil y nunca el `role` — acá ni siquiera se toca esa columna.
  const { error } = await client.from("profiles").update({ full_name: fullName, phone: phone || null }).eq("id", userData.user.id);
  if (error) {
    redirect("/mi-cuenta/privacidad?error=" + encodeURIComponent("No se pudo actualizar tu nombre o teléfono."));
  }

  redirect("/mi-cuenta/privacidad?profileSaved=1");
}

export async function updateEmailAction(formData: FormData): Promise<void> {
  const email = String(formData.get("email") ?? "").trim();

  if (email.length === 0) {
    redirect("/mi-cuenta/privacidad?error=" + encodeURIComponent("El correo no puede estar vacío."));
  }

  const client = await getActionClient();
  const { data: userData } = await client.auth.getUser();
  if (!userData.user) {
    redirect("/login?next=/mi-cuenta/privacidad");
  }

  // Cambiar el correo de Supabase Auth requiere confirmación desde el
  // correo nuevo (y el actual, si "Secure email change" está activo) —
  // nunca queda aplicado de inmediato, por eso el mensaje de éxito no dice
  // "cambiado" sino que pide revisar el correo.
  const { error } = await client.auth.updateUser({ email });
  if (error) {
    redirect("/mi-cuenta/privacidad?error=" + encodeURIComponent(error.message));
  }

  redirect("/mi-cuenta/privacidad?emailPending=1");
}

export async function updateCompanyAction(formData: FormData): Promise<void> {
  const address = String(formData.get("address") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const department = String(formData.get("department") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const companyId = String(formData.get("companyId") ?? "");

  if (companyId.length === 0) {
    redirect("/mi-cuenta/privacidad?error=" + encodeURIComponent("Empresa no válida."));
  }

  const client = await getActionClient();
  const { data: userData } = await client.auth.getUser();
  if (!userData.user) {
    redirect("/login?next=/mi-cuenta/privacidad");
  }

  // `companies_update_own` (docs/05-RLS-SECURITY-A.md) solo deja escribir
  // a `owner`/`accounting` de esa empresa (o master) — si el actor no
  // califica, Supabase simplemente no actualiza ninguna fila.
  const { error } = await client
    .from("companies")
    .update({
      address: address || null,
      city: city || null,
      department: department || null,
      phone: phone || null,
      email: email || null,
    })
    .eq("id", companyId);
  if (error) {
    redirect("/mi-cuenta/privacidad?error=" + encodeURIComponent("No se pudo actualizar los datos de la empresa."));
  }

  redirect("/mi-cuenta/privacidad?companySaved=1");
}

export async function updatePasswordAction(formData: FormData): Promise<void> {
  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  const parsed = confirmPasswordSchema.safeParse({ password: newPassword });
  if (!parsed.success) {
    redirect("/mi-cuenta/privacidad?error=" + encodeURIComponent(parsed.error.issues[0]?.message ?? "Contraseña inválida."));
  }
  if (newPassword !== confirmPassword) {
    redirect("/mi-cuenta/privacidad?error=" + encodeURIComponent("Las contraseñas nuevas no coinciden."));
  }

  const client = await getActionClient();
  const { data: userData } = await client.auth.getUser();
  if (!userData.user?.email) {
    redirect("/login?next=/mi-cuenta/privacidad");
  }

  // Reconfirma la contraseña actual antes de cambiarla — una sesión
  // válida no debería bastar para tomar una acción sensible como esta.
  const { error: signInError } = await client.auth.signInWithPassword({ email: userData.user.email, password: currentPassword });
  if (signInError) {
    redirect("/mi-cuenta/privacidad?error=" + encodeURIComponent("La contraseña actual no es correcta."));
  }

  const { error } = await client.auth.updateUser({ password: newPassword });
  if (error) {
    redirect("/mi-cuenta/privacidad?error=" + encodeURIComponent("No se pudo actualizar la contraseña."));
  }

  redirect("/mi-cuenta/privacidad?passwordSaved=1");
}

/**
 * Eliminar la cuenta no borra la fila de inmediato (Ley 1581 art. 8 —
 * docs/20-COMPLIANCE.md sección 4: se anonimiza, nunca se borra sin más,
 * porque pedidos/pagos/cotizaciones deben conservarse por obligación
 * fiscal DIAN). `anonymizeProfile` requiere `serviceClient` y hoy la
 * ejecuta `master` tras recibir esta solicitud — por eso acá se manda
 * como mensaje de contacto en vez de anonimizar directo desde la sesión
 * del cliente.
 */
export async function deleteAccountAction(formData: FormData): Promise<void> {
  const detail = String(formData.get("detail") ?? "");

  const client = await getActionClient();
  const { data: userData } = await client.auth.getUser();
  if (!userData.user) {
    redirect("/login?next=/mi-cuenta/privacidad");
  }

  const { data: profileData } = await client.from("profiles").select("full_name").eq("id", userData.user.id).maybeSingle();
  const fullName = (profileData as { full_name: string } | null)?.full_name ?? "Usuario";
  const email = userData.user.email ?? "";

  const message = `Solicitud Ley 1581 — Eliminar cuenta (anonimización de datos personales). Usuario: ${userData.user.id}.${detail ? ` Detalle: ${detail}` : ""}`;

  try {
    await submitContactMessage(client, { name: fullName, email, message }, { userId: userData.user.id });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "No se pudo enviar la solicitud.";
    redirect(`/mi-cuenta/privacidad?error=${encodeURIComponent(errorMessage)}`);
  }

  redirect("/mi-cuenta/privacidad?deletionSent=1");
}
