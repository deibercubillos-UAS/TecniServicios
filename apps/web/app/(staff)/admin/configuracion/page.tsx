import type { Metadata } from "next";
import { cookies } from "next/headers";
import { createServerClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";

import { updateSettingAction } from "./actions";

export const metadata: Metadata = {
  title: "Configuración — Panel maestro",
};

interface SettingRow {
  key: string;
  value: unknown;
  description: string | null;
  updated_at: string;
}

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(serverEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    getAll: () => cookieStore.getAll(),
    setAll: () => {},
  });
}

export default async function AdminConfiguracionPage({ searchParams }: { searchParams: Promise<{ error?: string; updated?: string }> }) {
  const { error, updated } = await searchParams;
  const supabase = await getSupabase();

  const { data: settingsData } = await supabase.from("settings").select("key,value,description,updated_at").order("key");
  const settings = (settingsData as SettingRow[] | null) ?? [];

  return (
    <div className="mx-auto flex max-w-[700px] flex-col gap-6 px-4 py-16">
      <h1 className="text-2xl font-bold text-text">Configuración</h1>
      <p className="text-sm text-text-muted">
        Parámetros globales de la plataforma. El umbral de cotización (regla de negocio 5.2 de `CLAUDE.md`) vive acá — nunca hardcodeado en el código.
      </p>

      {updated ? (
        <p className="rounded-[var(--radius)] border border-success bg-success/10 px-3 py-2 text-sm text-success">Configuración actualizada.</p>
      ) : null}
      {error ? (
        <p className="rounded-[var(--radius)] border border-danger bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>
      ) : null}

      {settings.length === 0 ? (
        <p className="text-text-muted">Sin parámetros de configuración.</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {settings.map((setting) => (
            <li key={setting.key} className="flex flex-col gap-2 rounded-[var(--radius)] border border-border p-4">
              <div>
                <p className="font-medium text-text">{setting.key}</p>
                {setting.description ? <p className="text-xs text-text-muted">{setting.description}</p> : null}
                <p className="text-xs text-text-muted">Actualizado {new Date(setting.updated_at).toLocaleString("es-CO")}</p>
              </div>
              <form action={updateSettingAction} className="flex flex-wrap items-end gap-3">
                <input type="hidden" name="key" value={setting.key} />
                <div className="flex flex-1 flex-col gap-1">
                  <label htmlFor={`value-${setting.key}`} className="text-sm text-text-muted">
                    Valor (JSON — un número va sin comillas)
                  </label>
                  <input
                    id={`value-${setting.key}`}
                    name="value"
                    defaultValue={JSON.stringify(setting.value)}
                    className="rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm"
                  />
                </div>
                <button type="submit" className="rounded-[var(--radius)] bg-brand px-4 py-2 text-sm font-semibold text-text-inverse hover:bg-brand-hover">
                  Guardar
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
