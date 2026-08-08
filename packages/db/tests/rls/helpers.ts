import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env["SUPABASE_URL"] ?? process.env["NEXT_PUBLIC_SUPABASE_URL"];
const serviceRoleKey = process.env["SUPABASE_SERVICE_ROLE_KEY"];
const anonKey = process.env["SUPABASE_ANON_KEY"] ?? process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"];

if (!url || !serviceRoleKey || !anonKey) {
  throw new Error(
    "Faltan variables de entorno para las pruebas de aislamiento RLS: " +
      "SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY " +
      "(GitHub Secrets en CI, .env.local en desarrollo — nunca committeadas).",
  );
}

const SUPABASE_URL: string = url;
const SUPABASE_SERVICE_ROLE_KEY: string = serviceRoleKey;
const SUPABASE_ANON_KEY: string = anonKey;

const TEST_PASSWORD = "RlsTest!2026";

export const adminClient: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export function anonClient(): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function createTestUser(
  email: string,
  fullName: string,
  role: "customer" | "seller" | "technician" | "master" = "customer",
): Promise<string> {
  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    password: TEST_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (error || !data.user) {
    throw new Error(`No se pudo crear el usuario de prueba ${email}: ${error?.message}`);
  }

  // El trigger handle_new_user (paso 6.1) ya crea la fila en profiles con
  // full_name desde user_metadata y role 'customer' por defecto — solo hace
  // falta corregir el rol si la prueba pide uno distinto.
  if (role !== "customer") {
    const { error: profileError } = await adminClient
      .from("profiles")
      .update({ role })
      .eq("id", data.user.id);
    if (profileError) {
      throw new Error(`No se pudo ajustar el rol de prueba ${email}: ${profileError.message}`);
    }
  }

  return data.user.id;
}

export async function deleteTestUser(userId: string): Promise<void> {
  if (!userId) return;
  await adminClient.from("profiles").delete().eq("id", userId);
  await adminClient.auth.admin.deleteUser(userId);
}

export async function signInAs(email: string): Promise<SupabaseClient> {
  const client = anonClient();
  const { data, error } = await client.auth.signInWithPassword({
    email,
    password: TEST_PASSWORD,
  });
  if (error || !data.session) {
    throw new Error(`No se pudo autenticar como ${email}: ${error?.message}`);
  }
  return client;
}
