"use client";

import { useState } from "react";

import { COLOMBIA_DEPARTMENTS, COLOMBIA_DEPARTMENTS_CITIES } from "@/lib/colombia-geo";

/** Departamento + ciudad como listas desplegables dependientes — la
 * ciudad solo muestra opciones del departamento elegido. Evita error
 * ortográfico y texto libre sin normalizar (antes era un solo input de
 * texto para "ciudad"). Envía dos campos de formulario: `department` y
 * `city`. */
export function DepartmentCityField({
  idPrefix,
  defaultDepartment = "",
  defaultCity = "",
  required = false,
}: {
  idPrefix: string;
  defaultDepartment?: string;
  defaultCity?: string;
  required?: boolean;
}) {
  const [department, setDepartment] = useState(defaultDepartment);
  const cities = department ? (COLOMBIA_DEPARTMENTS_CITIES[department] ?? []) : [];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="flex flex-col gap-1">
        <label htmlFor={`${idPrefix}-department`} className="text-sm font-medium text-text-muted">
          Departamento{required ? "" : " (opcional)"}
        </label>
        <select
          id={`${idPrefix}-department`}
          name="department"
          required={required}
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
        >
          <option value="">Seleccionar departamento</option>
          {COLOMBIA_DEPARTMENTS.map((dept) => (
            <option key={dept} value={dept}>
              {dept}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor={`${idPrefix}-city`} className="text-sm font-medium text-text-muted">
          Ciudad{required ? "" : " (opcional)"}
        </label>
        <select
          key={department}
          id={`${idPrefix}-city`}
          name="city"
          required={required}
          disabled={!department}
          defaultValue={department === defaultDepartment ? defaultCity : ""}
          className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2.5 text-sm focus:border-brand focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="">{department ? "Seleccionar ciudad" : "Elige un departamento primero"}</option>
          {cities.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
