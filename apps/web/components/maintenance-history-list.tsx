import Image from "next/image";
import { Icon } from "@tecni/ui";
import type { MaintenanceHistoryEntry } from "@/lib/get-maintenance-history";

/** Lista de reportes de mantenimiento completados, con fotos de evidencia
 * y firma de conformidad — reutilizado por `/mi-cuenta/equipos/[id]` y
 * `/mi-cuenta/mantenimientos` (mismo query en `get-maintenance-history.ts`,
 * no duplicado). Server Component: solo lectura, sin estado. */
export function MaintenanceHistoryList({ entries, showEquipmentName }: { entries: MaintenanceHistoryEntry[]; showEquipmentName?: boolean }) {
  if (entries.length === 0) {
    return <p className="text-sm text-text-muted">Sin mantenimientos completados todavía.</p>;
  }

  return (
    <ul className="flex flex-col gap-4">
      {entries.map((entry) => (
        <li key={entry.id} className="rounded-lg border border-border p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium text-text">
              {showEquipmentName && entry.equipmentName ? `${entry.equipmentName} · ` : ""}
              {new Date(entry.createdAt).toLocaleDateString("es-CO")}
            </p>
            {entry.nextServiceDate ? (
              <span className="text-xs text-text-muted">
                Próximo servicio sugerido: {new Date(`${entry.nextServiceDate}T00:00:00.000Z`).toLocaleDateString("es-CO", { timeZone: "UTC" })}
              </span>
            ) : null}
          </div>

          <p className="mt-2 whitespace-pre-line text-sm text-text">{entry.workDone}</p>
          {entry.recommendations ? <p className="mt-1 whitespace-pre-line text-sm text-text-muted">{entry.recommendations}</p> : null}

          {entry.attachments.length > 0 ? (
            <div className="mt-3">
              <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-text-muted">
                <Icon name="image" size={14} />
                Fotos del servicio
              </p>
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                {entry.attachments.map((url) => (
                  <a key={url} href={url} target="_blank" rel="noreferrer" className="relative aspect-square overflow-hidden rounded-[var(--radius)] border border-border bg-bg-alt">
                    <Image src={url} alt="Foto del servicio realizado" fill sizes="15vw" className="object-cover" />
                  </a>
                ))}
              </div>
            </div>
          ) : null}

          {entry.signatureUrl ? (
            <div className="mt-3">
              <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-text-muted">
                <Icon name="checkCircle" size={14} />
                Firma de conformidad
              </p>
              <a href={entry.signatureUrl} target="_blank" rel="noreferrer" className="relative block h-20 w-40 overflow-hidden rounded-[var(--radius)] border border-border bg-bg">
                <Image src={entry.signatureUrl} alt="Firma de conformidad del cliente" fill sizes="160px" className="object-contain" />
              </a>
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
