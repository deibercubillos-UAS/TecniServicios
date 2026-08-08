import type { SupabaseClient } from "@supabase/supabase-js";
import type { ContactInput } from "@tecni/shared";

export interface SubmitContactMessageContext {
  userId: string | null;
}

/**
 * Inserta un mensaje del formulario de contacto (docs/05-RLS-SECURITY.md,
 * tabla `contact_messages`) — nunca exige sesión, `userId` se guarda solo
 * si existe. Nunca deja pasar el error crudo de Postgres al llamador
 * (regla de `CLAUDE.md` sección 7).
 */
export async function submitContactMessage(
  client: SupabaseClient,
  input: ContactInput,
  ctx: SubmitContactMessageContext,
): Promise<void> {
  const { error } = await client.from("contact_messages").insert({
    name: input.name,
    email: input.email,
    phone: input.phone || null,
    message: input.message,
    user_id: ctx.userId,
  });
  if (error) {
    throw new Error("No se pudo enviar el mensaje. Intenta de nuevo.");
  }
}
