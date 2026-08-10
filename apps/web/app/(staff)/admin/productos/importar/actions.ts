"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";
import { bulkImportProducts, type BulkImportProductsResult, type BulkImportRow } from "@tecni/core";

/**
 * Se llama directo desde el componente cliente (no vía `<form action>`)
 * para poder devolver el resultado fila por fila y renderizarlo sin
 * recargar la página — patrón de Server Action invocada como función
 * normal, válido en Next.js App Router.
 */
export async function bulkImportProductsAction(rows: BulkImportRow[]): Promise<BulkImportProductsResult> {
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
    redirect("/login?next=/admin/productos/importar");
  }

  if (rows.length === 0) {
    throw new Error("No hay filas para importar.");
  }
  if (rows.length > 2000) {
    throw new Error("Máximo 2000 filas por archivo — divide el Excel en partes más pequeñas.");
  }

  return bulkImportProducts(client, rows);
}
