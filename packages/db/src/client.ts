import { createBrowserClient as createSupabaseBrowserClient } from "@supabase/ssr";
import { createServerClient as createSupabaseServerClient } from "@supabase/ssr";
import type { CookieMethodsServer } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * No importa `next/headers` a propósito — mantiene @tecni/db independiente
 * del framework (ver docs/01-ARCHITECTURE.md, misma regla que packages/core).
 * apps/web pasa el adaptador de cookies de Next (cookies() de next/headers).
 */
export function createBrowserClient(url: string, anonKey: string): SupabaseClient {
  return createSupabaseBrowserClient(url, anonKey);
}

export function createServerClient(
  url: string,
  anonKey: string,
  cookies: CookieMethodsServer,
): SupabaseClient {
  return createSupabaseServerClient(url, anonKey, { cookies });
}

/**
 * Bypassa RLS. Solo se instancia en el servidor, nunca en un componente
 * cliente (regla de oro 4 de CLAUDE.md). Sin cookies: no arrastra sesión de
 * usuario, cada llamada es una operación administrativa explícita.
 */
export function createServiceRoleClient(url: string, serviceRoleKey: string): SupabaseClient {
  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
