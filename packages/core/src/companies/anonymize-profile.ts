import type { SupabaseClient } from "@supabase/supabase-js";

import { recordAuditLog } from "../audit/record-audit-log";

export interface AnonymizeProfileContext {
  actorId: string;
  profileId: string;
}

const ANONYMIZED_NAME = "Usuario eliminado";

/**
 * Respuesta a una solicitud de supresión (Ley 1581, art. 8) —
 * `docs/20-COMPLIANCE.md` sección 4: no se borra la fila, se anonimiza.
 * `orders`/`payments`/`quotes` se conservan intactos (obligación fiscal
 * DIAN) y siguen enlazados por `profileId`, pero ya sin dato personal
 * legible. Requiere `serviceClient`: ningún `customer` tiene permiso de
 * escritura sobre el `profiles` de otro (ni siquiera el propio, más allá
 * de los campos que `profiles_update_self` permite) — esta acción la
 * ejecuta `master` tras recibir la solicitud (hoy por `contact_messages`,
 * sección 5 del mismo doc).
 */
export async function anonymizeProfile(serviceClient: SupabaseClient, ctx: AnonymizeProfileContext): Promise<void> {
  const { error } = await serviceClient
    .from("profiles")
    .update({
      full_name: ANONYMIZED_NAME,
      phone: null,
      avatar_url: null,
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", ctx.profileId);
  if (error) {
    throw new Error("No se pudo anonimizar el perfil.");
  }

  await recordAuditLog(serviceClient, {
    actorId: ctx.actorId,
    action: "profile.anonymized",
    entity: "profile",
    entityId: ctx.profileId,
    after: { full_name: ANONYMIZED_NAME, is_active: false },
  });
}
