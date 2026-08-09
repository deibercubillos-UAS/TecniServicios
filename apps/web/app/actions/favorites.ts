"use server";

import { cookies } from "next/headers";
import { createServerClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";
import { toggleFavorite } from "@tecni/core";

/**
 * Llamada directamente desde un componente cliente (no un <form>) —
 * Server Actions de Next.js soportan eso, no necesitan FormData.
 * Sin sesión real, no hace nada: el corazón no se renderiza para
 * anónimos (docs/12-MODULE-CATALOG.md sección 6b), pero esta función
 * igual valida por si acaso, nunca confía en el estado del cliente.
 */
export async function toggleFavoriteAction(productId: string): Promise<{ favorited: boolean } | { error: string }> {
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
    return { error: "Inicia sesión para guardar favoritos." };
  }

  try {
    const result = await toggleFavorite(client, userData.user.id, productId);
    return result;
  } catch (err) {
    return { error: err instanceof Error ? err.message : "No se pudo actualizar favoritos." };
  }
}
