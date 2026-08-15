import type { StatusCount } from "@tecni/core";

/** Barra horizontal por estado (CSS puro, sin librería de gráficos —
 * mismo criterio que `roi-calculator.tsx`) — ancho proporcional al
 * conteo más alto del propio grupo, no a un máximo global. */
export function MetricStatusBreakdown({
  rows,
  labelMap,
  showMoney = false,
}: {
  rows: StatusCount[];
  labelMap: Record<string, string>;
  showMoney?: boolean;
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-text-muted">Sin datos en este rango.</p>;
  }

  const maxCount = Math.max(...rows.map((r) => r.count));
  const money = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

  return (
    <ul className="flex flex-col gap-2">
      {rows.map((row) => (
        <li key={row.status} className="flex flex-col gap-1">
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="text-text">{labelMap[row.status] ?? row.status}</span>
            <span className="text-text-muted">
              {row.count}
              {showMoney && row.totalCop ? ` · ${money.format(row.totalCop)}` : ""}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-bg-alt">
            <div className="h-full rounded-full bg-brand" style={{ width: `${maxCount > 0 ? (row.count / maxCount) * 100 : 0}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
