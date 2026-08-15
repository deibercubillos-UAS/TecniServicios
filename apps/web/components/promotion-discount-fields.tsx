"use client";

import { useState } from "react";

/** Tipo + valor del descuento con una vista previa en vivo del texto que
 * verá el cliente ("10% de descuento" / "$50.000 COP de descuento") —
 * evita que el admin tenga que adivinar cómo se ve antes de guardar. */
export function PromotionDiscountFields({
  defaultType,
  defaultValue,
}: {
  defaultType: string;
  defaultValue: string;
}) {
  const [type, setType] = useState(defaultType);
  const [value, setValue] = useState(defaultValue);

  const numericValue = Number.parseFloat(value);
  const preview =
    Number.isFinite(numericValue) && numericValue > 0
      ? type === "percentage"
        ? `${numericValue}% de descuento`
        : `${numericValue.toLocaleString("es-CO")} COP de descuento`
      : null;

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="discountType" className="text-sm font-medium text-text-muted">
            Tipo de descuento
          </label>
          <select
            id="discountType"
            name="discountType"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm focus:border-brand focus:outline-none"
          >
            <option value="percentage">Porcentaje</option>
            <option value="fixed_amount">Monto fijo (COP)</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="discountValue" className="text-sm font-medium text-text-muted">
            Valor
          </label>
          <input
            id="discountValue"
            name="discountValue"
            type="number"
            min={0}
            step="0.01"
            required
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm focus:border-brand focus:outline-none"
          />
        </div>
      </div>
      {preview ? (
        <p className="text-xs text-text-muted">
          Se verá así: <span className="font-medium text-brand">{preview}</span>
        </p>
      ) : null}
    </div>
  );
}
