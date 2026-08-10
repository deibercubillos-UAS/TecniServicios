"use client";

import { useState } from "react";
import { Icon } from "@tecni/ui";

interface Spec {
  label: string;
  value: string;
}

interface ProductDocument {
  id: string;
  title: string;
  url: string;
}

/** Ambas pestañas con datos reales — nunca "Requerimientos de
 * pre-instalación" inventado sin fuente. Las fichas técnicas de
 * `documents` vienen de `product_documents` con `is_public = true`
 * (RLS: docs/05-RLS-SECURITY-C.md, subidas reales desde
 * `/admin/productos/[id]`, ver docs/11-STORAGE-R2.md). */
export function ProductTabs({
  description,
  specs,
  documents = [],
}: {
  description: string | null;
  specs: Spec[];
  documents?: ProductDocument[];
}) {
  const hasSpecsTab = specs.length > 0 || documents.length > 0;
  const [tab, setTab] = useState<"descripcion" | "especificaciones">(description ? "descripcion" : "especificaciones");

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface">
      <div role="tablist" aria-label="Detalle del producto" className="flex border-b border-border bg-bg-alt">
        {description ? (
          <button
            type="button"
            role="tab"
            id="tab-descripcion"
            aria-selected={tab === "descripcion"}
            aria-controls="panel-descripcion"
            tabIndex={tab === "descripcion" ? 0 : -1}
            onClick={() => setTab("descripcion")}
            className={`whitespace-nowrap px-6 py-4 text-xs font-bold uppercase tracking-wider transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand ${
              tab === "descripcion" ? "border-b-2 border-brand bg-surface text-brand" : "text-text-muted hover:text-text"
            }`}
          >
            Descripción
          </button>
        ) : null}
        {hasSpecsTab ? (
          <button
            type="button"
            role="tab"
            id="tab-especificaciones"
            aria-selected={tab === "especificaciones"}
            aria-controls="panel-especificaciones"
            tabIndex={tab === "especificaciones" ? 0 : -1}
            onClick={() => setTab("especificaciones")}
            className={`whitespace-nowrap px-6 py-4 text-xs font-bold uppercase tracking-wider transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand ${
              tab === "especificaciones" ? "border-b-2 border-brand bg-surface text-brand" : "text-text-muted hover:text-text"
            }`}
          >
            Especificaciones técnicas
          </button>
        ) : null}
      </div>

      <div className="p-6 md:p-8">
        {tab === "descripcion" && description ? (
          <p id="panel-descripcion" role="tabpanel" aria-labelledby="tab-descripcion" className="whitespace-pre-line text-text-muted">
            {description}
          </p>
        ) : null}
        {tab === "especificaciones" && hasSpecsTab ? (
          <div id="panel-especificaciones" role="tabpanel" aria-labelledby="tab-especificaciones" className="flex flex-col gap-6">
            {specs.length > 0 ? (
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
            {documents.length > 0 ? (
              <div className="flex flex-col gap-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">Ficha técnica</h3>
                <ul className="flex flex-col gap-2">
                  {documents.map((doc) => (
                    <li key={doc.id}>
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex w-fit items-center gap-2 rounded-[var(--radius)] border border-border px-4 py-2.5 text-sm font-medium text-text transition-colors hover:border-brand hover:text-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                      >
                        <Icon name="document" size={16} />
                        {doc.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
