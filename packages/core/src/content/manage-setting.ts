import type { SupabaseClient } from "@supabase/supabase-js";

export interface UpdateSettingResult {
  key: string;
}

/**
 * `settings.value` es `jsonb` — `value` acá ya viene serializado a JSON
 * (número, texto o lo que el `key` requiera), no un objeto envolvente.
 * `settings_master` (05-RLS-SECURITY-C.md) exige `master`; esta función
 * no repite esa validación.
 */
export async function updateSetting(client: SupabaseClient, key: string, value: unknown, updatedBy: string): Promise<UpdateSettingResult> {
  const { data, error } = await client
    .from("settings")
    .update({ value, updated_by: updatedBy, updated_at: new Date().toISOString() })
    .eq("key", key)
    .select("key")
    .single();
  if (error || !data) {
    throw new Error("No se pudo actualizar la configuración.");
  }

  return { key: data["key"] as string };
}
