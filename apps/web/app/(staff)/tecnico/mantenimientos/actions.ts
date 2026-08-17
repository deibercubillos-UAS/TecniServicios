"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";
import { confirmMaintenance, rescheduleMaintenance, completeMaintenance } from "@tecni/core";
import { buildMaintenanceAssetKey, uploadToR2, type R2Config } from "@tecni/integrations";

async function getSessionClient() {
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
    redirect("/login?next=/tecnico/mantenimientos");
  }
  return { client, userId: userData.user.id };
}

export async function confirmMaintenanceAction(formData: FormData): Promise<void> {
  const requestId = formData.get("requestId");
  if (typeof requestId !== "string" || requestId.length === 0) {
    redirect("/tecnico/mantenimientos?error=" + encodeURIComponent("Datos inválidos."));
  }

  const { client } = await getSessionClient();

  try {
    await confirmMaintenance(client, requestId);
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudo confirmar el mantenimiento.";
    redirect("/tecnico/mantenimientos?error=" + encodeURIComponent(message));
  }

  redirect("/tecnico/mantenimientos?confirmed=1");
}

export async function rescheduleMaintenanceAction(formData: FormData): Promise<void> {
  const requestId = formData.get("requestId");
  const scheduledAt = formData.get("scheduledAt");
  if (typeof requestId !== "string" || requestId.length === 0 || typeof scheduledAt !== "string" || scheduledAt.length === 0) {
    redirect("/tecnico/mantenimientos?error=" + encodeURIComponent("Selecciona fecha y hora."));
  }

  const { client } = await getSessionClient();

  try {
    await rescheduleMaintenance(client, requestId, new Date(scheduledAt as string).toISOString());
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudo reprogramar el mantenimiento.";
    redirect("/tecnico/mantenimientos?error=" + encodeURIComponent(message));
  }

  redirect("/tecnico/mantenimientos?rescheduled=1");
}

function getR2Config(): R2Config {
  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_PUBLIC_URL } = serverEnv;
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME || !R2_PUBLIC_URL) {
    throw new Error("El almacenamiento de archivos no está configurado (variables R2_* faltantes).");
  }
  return {
    accountId: R2_ACCOUNT_ID,
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
    bucketName: R2_BUCKET_NAME,
    publicUrl: R2_PUBLIC_URL,
  };
}

/** `dataUrl` viene del `SignaturePad` (canvas → `toDataURL("image/png")`,
 * ver `signature-pad.tsx`) — siempre `data:image/png;base64,...`. */
function dataUrlToBuffer(dataUrl: string): Buffer {
  const base64 = dataUrl.split(",")[1] ?? "";
  return Buffer.from(base64, "base64");
}

export async function completeMaintenanceAction(formData: FormData): Promise<void> {
  const requestId = formData.get("requestId");
  const workDone = formData.get("workDone");
  const recommendationsRaw = formData.get("recommendations");
  const nextServiceDate = formData.get("nextServiceDate");
  const signedByName = formData.get("signedByName");
  const signatureDataUrl = formData.get("signatureDataUrl");
  const photos = formData.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);

  if (typeof requestId !== "string" || requestId.length === 0 || typeof workDone !== "string" || workDone.trim().length === 0) {
    redirect("/tecnico/mantenimientos?error=" + encodeURIComponent("Describe el trabajo realizado."));
  }
  if (typeof signedByName !== "string" || signedByName.trim().length === 0) {
    redirect("/tecnico/mantenimientos?error=" + encodeURIComponent("Registra el nombre de quien recibe el trabajo."));
  }
  if (typeof signatureDataUrl !== "string" || signatureDataUrl.length === 0) {
    redirect("/tecnico/mantenimientos?error=" + encodeURIComponent("Se requiere la firma de conformidad del cliente."));
  }

  const { client, userId } = await getSessionClient();

  // La firma pide un nombre a mano (sin columna dedicada en el esquema, ver
  // docs/tasks/done/DONE-mantenimiento-fotos-firma.md) — se antepone a
  // `recommendations` como línea de conformidad, nunca se pierde el dato.
  const recommendations = [
    `Recibido por: ${(signedByName as string).trim()}`,
    typeof recommendationsRaw === "string" && recommendationsRaw.trim().length > 0 ? recommendationsRaw.trim() : null,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const config = getR2Config();

    const attachments: string[] = [];
    for (const photo of photos) {
      const buffer = Buffer.from(await photo.arrayBuffer());
      const key = buildMaintenanceAssetKey("photos", requestId, photo.name);
      const uploaded = await uploadToR2(config, { key, body: buffer, contentType: photo.type || "image/jpeg" });
      attachments.push(uploaded.url);
    }

    const signatureKey = buildMaintenanceAssetKey("signature", requestId, "firma.png");
    const uploadedSignature = await uploadToR2(config, {
      key: signatureKey,
      body: dataUrlToBuffer(signatureDataUrl as string),
      contentType: "image/png",
    });

    await completeMaintenance(
      client,
      {
        requestId,
        workDone,
        recommendations,
        ...(typeof nextServiceDate === "string" && nextServiceDate.length > 0 ? { nextServiceDate } : {}),
        attachments,
        customerSignatureUrl: uploadedSignature.url,
      },
      { technicianId: userId },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudo registrar el reporte.";
    redirect("/tecnico/mantenimientos?error=" + encodeURIComponent(message));
  }

  redirect("/tecnico/mantenimientos?completed=1");
}
