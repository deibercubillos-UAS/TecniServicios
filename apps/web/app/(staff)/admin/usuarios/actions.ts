"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient, createServiceRoleClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";
import { anonymizeProfile, changeCompanyMemberRole, changeUserRole, type ChangeMemberRoleInput, type ChangeUserRoleContext } from "@tecni/core";

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
    redirect("/login?next=/admin/usuarios");
  }
  const serviceClient = createServiceRoleClient(serverEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv.SUPABASE_SERVICE_ROLE_KEY);
  return { client, serviceClient, userId: userData.user.id };
}

/** Cada pestaña (Equipo/Clientes) y cada ficha de edición es una ruta
 * separada — las formas mandan de vuelta un `returnTo` para no aterrizar
 * siempre en "Equipo" sin importar desde dónde se disparó la acción.
 * Restringido a rutas bajo /admin/usuarios (nunca un redirect abierto). */
function returnPath(formData: FormData): string {
  const returnTo = String(formData.get("returnTo") ?? "");
  return returnTo.startsWith("/admin/usuarios") ? returnTo : "/admin/usuarios";
}

export async function changeUserRoleAction(formData: FormData): Promise<void> {
  const userId = formData.get("userId");
  const newRole = formData.get("newRole");
  const previousRole = formData.get("previousRole");
  const path = returnPath(formData);
  if (typeof userId !== "string" || typeof newRole !== "string" || typeof previousRole !== "string") {
    redirect(`${path}?error=` + encodeURIComponent("Datos inválidos."));
  }

  const { client, serviceClient, userId: actorId } = await getSession();

  try {
    await changeUserRole(client, serviceClient, {
      actorId,
      targetUserId: userId,
      newRole: newRole as ChangeUserRoleContext["newRole"],
      previousRole,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudo cambiar el rol.";
    redirect(`${path}?error=` + encodeURIComponent(message));
  }

  redirect(`${path}?updated=1`);
}

/** Respuesta a una solicitud de supresión Ley 1581 (docs/20-COMPLIANCE.md
 * sección 4) — anonimiza el perfil, nunca borra la fila ni el historial de
 * pedidos/pagos/cotizaciones. */
export async function anonymizeProfileAction(formData: FormData): Promise<void> {
  const profileId = formData.get("profileId");
  const path = returnPath(formData);
  if (typeof profileId !== "string" || profileId.length === 0) {
    redirect(`${path}?error=` + encodeURIComponent("Datos inválidos."));
  }

  const { serviceClient, userId: actorId } = await getSession();

  try {
    await anonymizeProfile(serviceClient, { actorId, profileId });
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudo anonimizar el perfil.";
    redirect(`${path}?error=` + encodeURIComponent(message));
  }

  redirect(`${path}?updated=1`);
}

export async function changeCompanyMemberRoleAction(formData: FormData): Promise<void> {
  const companyMemberId = formData.get("companyMemberId");
  const memberRole = formData.get("memberRole");
  const path = returnPath(formData);
  if (typeof companyMemberId !== "string" || typeof memberRole !== "string") {
    redirect(`${path}?error=` + encodeURIComponent("Datos inválidos."));
  }

  const { client, serviceClient, userId: actorId } = await getSession();

  try {
    await changeCompanyMemberRole(client, serviceClient, actorId, {
      companyMemberId,
      memberRole: memberRole as ChangeMemberRoleInput["memberRole"],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudo cambiar el rol interno.";
    redirect(`${path}?error=` + encodeURIComponent(message));
  }

  redirect(`${path}?updated=1`);
}
