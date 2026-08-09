"use client";

import { useState } from "react";

interface Spec {
  label: string;
  value: string;
}

/** Dos pestañas, las dos con datos reales de la ficha — nunca
 * "Requerimientos de pre-instalación" o "Manuales PDF" inventados sin
 * una fuente real detrás (product_documents sigue sin política de
 * lectura, docs/12-MODULE-CATALOG.md sección 6). */
export function ProductTabs({ description, specs }: { description: string | null; specs: Spec[] }) {
  const [tab, setTab] = useState<"descripcion" | "especificaciones">(description ? "descripcion" : "especificaciones");

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface">
      <div className="flex border-b border-border bg-bg-alt">
        {description ? (
          <button
            type="button"
            onClick={() => setTab("descripcion")}
            className={`whitespace-nowrap px-6 py-4 text-xs font-bold uppercase tracking-wider transition-colors ${
              tab === "descripcion" ? "border-b-2 border-brand bg-surface text-brand" : "text-text-muted hover:text-text"
            }`}
          >
            Descripción
          </button>
        ) : null}
        {specs.length > 0 ? (
          <button
            type="button"
            onClick={() => setTab("especificaciones")}
            className={`whitespace-nowrap px-6 py-4 text-xs font-bold uppercase tracking-wider transition-colors ${
              tab === "especificaciones" ? "border-b-2 border-brand bg-surface text-brand" : "text-text-muted hover:text-text"
            }`}
          >
            Especificaciones técnicas
          </button>
        ) : null}
      </div>

      <div className="p-6 md:p-8">
        {tab === "descripcion" && description ? (
          <p className="whitespace-pre-line text-text-muted">{description}</p>
        ) : null}
        {tab === "especificaciones" && specs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b-2 border-border text-xs uppercase tracking-wider text-text-muted">
                <tr>
                  <th className="px-4 pb-3">Característica</th>
                  <th className="px-4 pb-3">Valor</th>
                </tr>
              </thead>
              <tbody>
                {specs.map((spec, index) => (
                  <tr key={spec.label} className={index % 2 === 0 ? "bg-surface" : "bg-bg-alt"}>
                    <td className="px-4 py-3 font-semibold text-text-muted">{spec.label}</td>
                    <td className="px-4 py-3 text-text">{spec.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </div>
  );
}
