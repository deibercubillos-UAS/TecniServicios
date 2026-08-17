"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";
import { updateSetting } from "@tecni/core";

import { SETTINGS_SECTIONS } from "@/lib/settings-config";

async function getSession() {
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
    redirect("/login?next=/admin/configuracion");
  }
  return { client, userId: userData.user.id };
}

const ALL_FIELDS = SETTINGS_SECTIONS.flatMap((section) => section.fields);

/**
 * Guarda todos los campos presentes en el formulario enviado (una
 * sección a la vez — cada `<form>` de la página solo manda los campos
 * de su propia sección, el resto ni aparece en el `FormData`). El tipo
 * de cada campo (número vs texto) sale de `SETTINGS_SECTIONS`, la misma
 * configuración que pinta el formulario — nunca se edita JSON crudo.
 */
export async function updateSettingsAction(formData: FormData): Promise<void> {
  const { client, userId } = await getSession();

  const errors: string[] = [];
  let savedAny = false;

  for (const field of ALL_FIELDS) {
    const raw = formData.get(field.key);
    if (raw === null) continue;

    let value: unknown;
    if (field.type === "number") {
      const num = Number(String(raw).replace(/[.,\s]/g, ""));
      if (Number.isNaN(num)) {
        errors.push(`${field.label}: debe ser un número.`);
        continue;
      }
      value = num;
    } else if (field.type === "boolean") {
      value = raw === "1";
    } else {
      value = String(raw).trim();
    }

    try {
      await updateSetting(client, field.key, value, userId);
      savedAny = true;
    } catch {
      errors.push(`${field.label}: no se pudo guardar.`);
    }
  }

  if (errors.length > 0) {
    redirect("/admin/configuracion?error=" + encodeURIComponent(errors.join(" ")));
  }
  if (!savedAny) {
    redirect("/admin/configuracion?error=" + encodeURIComponent("No había nada que guardar."));
  }

  redirect("/admin/configuracion?updated=1");
}
