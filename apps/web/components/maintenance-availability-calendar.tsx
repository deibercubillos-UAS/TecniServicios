import Link from "next/link";
import { Icon } from "@tecni/ui";

export interface CalendarAvailabilityRow {
  id: string;
  technicianName: string | null;
  city: string | null;
  department: string | null;
  maxVisits: number;
}

export interface CalendarDayInfo {
  rows: CalendarAvailabilityRow[];
  booked: number;
}

const WEEKDAY_HEADERS = ["L", "M", "X", "J", "V", "S", "D"];
const MONTH_LABEL_FORMATTER = new Intl.DateTimeFormat("es-CO", { month: "long", year: "numeric" });

function parseMonthKey(monthKey: string): { year: number; monthNum: number } {
  const parts = monthKey.split("-").map(Number);
  return { year: parts[0] ?? new Date().getFullYear(), monthNum: parts[1] ?? new Date().getMonth() + 1 };
}

function addMonths(monthKey: string, delta: number): string {
  const { year, monthNum } = parseMonthKey(monthKey);
  const date = new Date(year, monthNum - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

/** Vista de calendario del mes — un vistazo rápido a qué días ya tienen
 * disponibilidad abierta, con técnico y ciudad, sin tener que leer la
 * lista completa fecha por fecha. Puramente de lectura: para abrir o
 * cerrar disponibilidad se usan los formularios de arriba. */
export function MaintenanceAvailabilityCalendar({
  month,
  byDate,
}: {
  month: string;
  byDate: Map<string, CalendarDayInfo>;
}) {
  const { year, monthNum } = parseMonthKey(month);
  const firstOfMonth = new Date(year, monthNum - 1, 1);
  const daysInMonth = new Date(year, monthNum, 0).getDate();
  // getDay(): 0=domingo..6=sábado → se convierte a offset con lunes primero.
  const leadingBlanks = (firstOfMonth.getDay() + 6) % 7;

  const cells: (number | null)[] = [...Array(leadingBlanks).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);

  const monthLabel = MONTH_LABEL_FORMATTER.format(firstOfMonth);
  const todayKey = new Date().toISOString().slice(0, 10);

  return (
    <section className="rounded-xl border border-border bg-surface p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-bold text-text">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-subtle text-brand">
            <Icon name="clock" size={16} />
          </span>
          Calendario — <span className="capitalize">{monthLabel}</span>
        </h2>
        <div className="flex items-center gap-1">
          <Link
            href={`/admin/mantenimientos?month=${addMonths(month, -1)}`}
            aria-label="Mes anterior"
            className="flex h-8 w-8 items-center justify-center rounded-[var(--radius)] text-text-muted transition-colors hover:bg-bg-alt hover:text-text"
          >
            <Icon name="chevronLeft" size={16} />
          </Link>
          <Link
            href={`/admin/mantenimientos?month=${new Date().toISOString().slice(0, 7)}`}
            className="rounded-[var(--radius)] px-2 py-1 text-xs font-medium text-text-muted transition-colors hover:bg-bg-alt hover:text-text"
          >
            Hoy
          </Link>
          <Link
            href={`/admin/mantenimientos?month=${addMonths(month, 1)}`}
            aria-label="Mes siguiente"
            className="flex h-8 w-8 items-center justify-center rounded-[var(--radius)] text-text-muted transition-colors hover:bg-bg-alt hover:text-text"
          >
            <Icon name="chevronRight" size={16} />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-text-muted">
        {WEEKDAY_HEADERS.map((label) => (
          <div key={label} className="py-1">
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={`blank-${i}`} className="min-h-[76px] rounded-[var(--radius)]" />;

          const dateKey = `${year}-${String(monthNum).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const info = byDate.get(dateKey);
          const totalMaxVisits = info?.rows.reduce((sum, row) => sum + row.maxVisits, 0) ?? 0;
          const full = Boolean(info) && (info?.booked ?? 0) >= totalMaxVisits;
          const isToday = dateKey === todayKey;

          return (
            <div
              key={dateKey}
              className={`flex min-h-[76px] flex-col gap-0.5 rounded-[var(--radius)] border p-1.5 text-left ${
                isToday ? "border-brand" : "border-border"
              } ${info ? (full ? "bg-danger/5" : "bg-success/5") : "bg-bg"}`}
            >
              <span className={`text-xs ${isToday ? "font-bold text-brand" : "text-text-muted"}`}>{day}</span>
              {info ? (
                <>
                  <span className={`text-[11px] font-medium ${full ? "text-danger" : "text-success"}`}>
                    {info.booked}/{totalMaxVisits} cupo{totalMaxVisits === 1 ? "" : "s"}
                  </span>
                  {info.rows.slice(0, 2).map((row) => (
                    <span
                      key={row.id}
                      className="truncate text-[11px] text-text-muted"
                      title={`${row.technicianName ?? "Sin técnico"} · ${row.city ? `${row.city}${row.department ? `, ${row.department}` : ""}` : "sin ciudad"}`}
                    >
                      {row.technicianName ?? "Sin técnico"}
                      {row.city ? ` · ${row.city}` : ""}
                    </span>
                  ))}
                  {info.rows.length > 2 ? <span className="text-[11px] text-text-muted">+{info.rows.length - 2} más</span> : null}
                </>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap gap-4 text-xs text-text-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-success/40" /> Con cupo
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-danger/40" /> Sin cupo
        </span>
      </div>
    </section>
  );
}
