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
  });
  if (error || !data.user) {
    throw new Error(`No se pudo crear el usuario de prueba ${email}: ${error?.message}`);
  }

  const { error: profileError } = await adminClient
    .from("profiles")
    .insert({ id: data.user.id, full_name: fullName, role });
  if (profileError) {
    throw new Error(`No se pudo crear el perfil de prueba ${email}: ${profileError.message}`);
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
