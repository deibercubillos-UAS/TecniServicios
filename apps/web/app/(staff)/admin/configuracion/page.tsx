import type { Metadata } from "next";
import { cookies } from "next/headers";
import { createServerClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";
import { Icon } from "@tecni/ui";

import { SubmitButton } from "@/components/submit-button";
import { SETTINGS_SECTIONS } from "@/lib/settings-config";
import { updateSettingsAction } from "./actions";

export const metadata: Metadata = {
  title: "Configuración — Panel maestro",
};

interface SettingRow {
  key: string;
  value: unknown;
  updated_at: string;
}

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(serverEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    getAll: () => cookieStore.getAll(),
    setAll: () => {},
  });
}

function fieldDefaultValue(raw: unknown): string {
  return raw === undefined || raw === null ? "" : String(raw);
}

export default async function AdminConfiguracionPage({ searchParams }: { searchParams: Promise<{ error?: string; updated?: string }> }) {
  const { error, updated } = await searchParams;
  const supabase = await getSupabase();

  const { data: settingsData } = await supabase.from("settings").select("key,value,updated_at");
  const settingByKey = new Map(((settingsData as SettingRow[] | null) ?? []).map((s) => [s.key, s]));

  return (
    <div className="mx-auto flex max-w-[700px] flex-col gap-6 px-4 py-16">
      <div>
        <h1 className="text-2xl font-bold text-text">Configuración</h1>
        <p className="text-sm text-text-muted">Parámetros globales de la plataforma, agrupados por dónde se usan.</p>
      </div>

      {updated ? (
        <p className="flex items-center gap-2 rounded-[var(--radius)] border border-success bg-success/10 px-3 py-2 text-sm text-success">
          <Icon name="checkCircle" size={16} />
          Configuración actualizada.
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="flex items-center gap-2 rounded-[var(--radius)] border border-danger bg-danger/10 px-3 py-2 text-sm text-danger">
          <Icon name="close" size={16} />
          {error}
        </p>
      ) : null}

      {SETTINGS_SECTIONS.map((section) => {
        const lastUpdated = section.fields
          .map((f) => settingByKey.get(f.key)?.updated_at)
          .filter((v): v is string => Boolean(v))
          .sort()
          .at(-1);

        return (
          <section key={section.id} className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5">
            <div>
              <h2 className="flex items-center gap-2 font-bold text-text">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-subtle text-brand">
                  <Icon name={section.icon} size={16} />
                </span>
                {section.title}
              </h2>
              <p className="mt-1 text-sm text-text-muted">{section.description}</p>
            </div>

            <form action={updateSettingsAction} className="flex flex-col gap-4">
              {section.fields.map((field) => {
                const current = settingByKey.get(field.key);
                return (
                  <div key={field.key} className="flex flex-col gap-1">
                    <label htmlFor={field.key} className="text-sm font-medium text-text-muted">
                      {field.label}
                    </label>
                    <input
                      id={field.key}
                      name={field.key}
                      type={field.type === "number" ? "number" : field.type}
                      inputMode={field.type === "number" ? "numeric" : undefined}
                      min={field.type === "number" ? 0 : undefined}
                      defaultValue={fieldDefaultValue(current?.value)}
                      placeholder={field.placeholder}
                      className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm focus:border-brand focus:outline-none"
                    />
                    {field.helper ? <p className="text-xs text-text-muted">{field.helper}</p> : null}
                  </div>
                );
              })}

              <div className="flex flex-wrap items-center justify-between gap-2">
                {lastUpdated ? (
                  <p className="text-xs text-text-muted">Actualizado {new Date(lastUpdated).toLocaleString("es-CO")}</p>
                ) : (
                  <span />
                )}
                <SubmitButton
                  pendingLabel="Guardando…"
                  className="rounded-[var(--radius)] bg-brand px-4 py-2 text-sm font-semibold text-text-inverse transition-colors hover:bg-brand-hover disabled:cursor-wait disabled:opacity-70"
                >
                  Guardar cambios
                </SubmitButton>
              </div>
            </form>
          </section>
        );
      })}
    </div>
  );
}
