import { cookies } from "next/headers";
import { createServerClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";

/** Valor por defecto sembrado en `settings` para las claves `contact_*`
 * (`packages/db/migrations/20260809340000_seed_contact_settings.sql`) —
 * el master aún no lo editó desde /admin/configuracion. Se usa para
 * distinguir "sin dato real todavía" de una cadena vacía. */
export const PLACEHOLDER = "Pendiente de definir";

/** `true` cuando el valor es un dato real de contacto, no el placeholder
 * ni una cadena vacía. Compartido entre /contacto y el footer — mismo
 * criterio de "nunca mostrar un dato inventado". */
export function isRealContactValue(value: string | undefined): value is string {
  return Boolean(value) && value !== PLACEHOLDER;
}

interface SettingRow {
  key: string;
  value: unknown;
}

/** Lee todas las claves `contact_*` de `settings` (lectura pública, RLS
 * permite `anon` sobre `settings`). Mismo patrón que `/contacto` — se
 * consume ahí y en el footer, sin duplicar la consulta. */
export async function getContactSettings(): Promise<Record<string, string>> {
  const cookieStore = await cookies();
  const supabase = createServerClient(serverEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    getAll: () => cookieStore.getAll(),
    setAll: () => {},
  });
  const { data } = await supabase.from("settings").select("key,value").like("key", "contact_%");
  const rows = (data as SettingRow[] | null) ?? [];
  return Object.fromEntries(rows.map((r) => [r.key, typeof r.value === "string" ? r.value : ""]));
}
