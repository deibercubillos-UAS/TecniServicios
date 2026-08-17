"use server";

import { cookies } from "next/headers";
import { createServerClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";

import { getCartSummary, type CartSummary } from "./get-cart-summary";

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(serverEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    getAll: () => cookieStore.getAll(),
    setAll: () => {},
  });
}

/** El drawer la llama directamente (no vía `<form>`) cuando se abre, para
 * poder mostrar un estado de carga y refrescar tras cada mutación sin
 * navegar. Reutiliza `getCartSummary()` — el mismo resumen que ya usa la
 * página completa `/carrito`. */
export async function getCartDrawerSummaryAction(): Promise<CartSummary> {
  const supabase = await getSupabase();
  return getCartSummary(supabase);
}
