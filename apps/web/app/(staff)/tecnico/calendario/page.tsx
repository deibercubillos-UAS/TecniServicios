import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { createServerClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";
import { Icon } from "@tecni/ui";

export const metadata: Metadata = {
  title: "Calendario — Panel de técnico",
};

const PENDING_STATUSES = new Set(["requested", "confirmed", "rescheduled", "in_progress"]);
const WEEKDAY_HEADERS = ["L", "M", "X", "J", "V", "S", "D"];
const MONTH_LABEL_FORMATTER = new Intl.DateTimeFormat("es-CO", { month: "long", year: "numeric" });
const BOGOTA_DATE_FORMATTER = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" });

interface MaintenanceRow {
  id: string;
  status: string;
  scheduled_at: string | null;
  preferred_date: string | null;
  companies: { legal_name: string } | null;
  owned_equipment: { products: { name: string } | null } | null;
}

interface DayDetail {
  id: string;
  label: string;
  pending: boolean;
}

interface DayInfo {
  pendingCount: number;
  completedCount: number;
  details: DayDetail[];
}

function parseMonthKey(monthKey: string): { year: number; monthNum: number } {
  const parts = monthKey.split("-").map(Number);
  return { year: parts[0] ?? new Date().getFullYear(), monthNum: parts[1] ?? new Date().getMonth() + 1 };
}

function addMonths(monthKey: string, delta: number): string {
  const { year, monthNum } = parseMonthKey(monthKey);
  const date = new Date(year, monthNum - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

/** Clave de fecha en zona horaria de Colombia, no UTC — un
 * `scheduled_at` cerca de medianoche (ej. 23:30 hora Bogotá) cae en el
 * día correcto sin importar en qué zona horaria corre el servidor. Los
 * `date` puros (como `preferred_date`) no tienen este problema, pero se
 * procesan igual por consistencia. */
function toBogotaDateKey(isoOrDate: string): string {
  const date = isoOrDate.length === 10 ? new Date(`${isoOrDate}T12:00:00`) : new Date(isoOrDate);
  return BOGOTA_DATE_FORMATTER.format(date);
}

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(serverEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    getAll: () => cookieStore.getAll(),
    setAll: () => {},
  });
}

export default async function TecnicoCalendarioPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month: monthParam } = await searchParams;
  const month = monthParam && /^\d{4}-\d{2}$/.test(monthParam) ? monthParam : new Date().toISOString().slice(0, 7);
  const supabase = await getSupabase();

  // El middleware ya exige technician/master para llegar a /tecnico.
  // `maintenance_read` (05-RLS-SECURITY-C.md) limita esto a lo asignado
  // al técnico, o todo si es master — mismo patrón sin filtro explícito
  // que ya usa /tecnico/mantenimientos.
  const { data: requestsData } = await supabase
    .from("maintenance_requests")
    .select("id,status,scheduled_at,preferred_date,companies(legal_name),owned_equipment(products(name))");
  const requests = (requestsData as unknown as MaintenanceRow[] | null) ?? [];

  const byDate = new Map<string, DayInfo>();
  for (const request of requests) {
    const dateSource = request.scheduled_at ?? request.preferred_date;
    if (!dateSource) continue;
    const dateKey = toBogotaDateKey(dateSource);
    const pending = PENDING_STATUSES.has(request.status);
    const existing = byDate.get(dateKey) ?? { pendingCount: 0, completedCount: 0, details: [] };
    if (pending) existing.pendingCount += 1;
    else if (request.status === "completed") existing.completedCount += 1;
    existing.details.push({
      id: request.id,
      label: `${request.owned_equipment?.products?.name ?? "Equipo"} · ${request.companies?.legal_name ?? "Empresa"}`,
      pending,
    });
    byDate.set(dateKey, existing);
  }

  const { year, monthNum } = parseMonthKey(month);
  const firstOfMonth = new Date(year, monthNum - 1, 1);
  const daysInMonth = new Date(year, monthNum, 0).getDate();
  const leadingBlanks = (firstOfMonth.getDay() + 6) % 7;
  const cells: (number | null)[] = [...Array(leadingBlanks).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);

  const monthLabel = MONTH_LABEL_FORMATTER.format(firstOfMonth);
  const todayKey = toBogotaDateKey(new Date().toISOString());

  return (
    <div className="mx-auto flex max-w-[900px] flex-col gap-6 px-4 py-16">
      <div>
        <h1 className="text-2xl font-bold text-text">Calendario</h1>
        <p className="text-sm text-text-muted">Trabajos pendientes y programación de mantenimientos.</p>
      </div>

      <section className="rounded-xl border border-border bg-surface p-5">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 font-bold text-text">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-subtle text-brand">
              <Icon name="calendar" size={16} />
            </span>
            <span className="capitalize">{monthLabel}</span>
          </h2>
          <div className="flex items-center gap-1">
            <Link
              href={`/tecnico/calendario?month=${addMonths(month, -1)}`}
              aria-label="Mes anterior"
              className="flex h-8 w-8 items-center justify-center rounded-[var(--radius)] text-text-muted transition-colors hover:bg-bg-alt hover:text-text"
            >
              <Icon name="chevronLeft" size={16} />
            </Link>
            <Link
              href={`/tecnico/calendario?month=${new Date().toISOString().slice(0, 7)}`}
              className="rounded-[var(--radius)] px-2 py-1 text-xs font-medium text-text-muted transition-colors hover:bg-bg-alt hover:text-text"
            >
              Hoy
            </Link>
            <Link
              href={`/tecnico/calendario?month=${addMonths(month, 1)}`}
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
            const isToday = dateKey === todayKey;
            const hasPending = Boolean(info) && info!.pendingCount > 0;
            const hasOnlyCompleted = Boolean(info) && !hasPending && info!.completedCount > 0;

            return (
              <div
                key={dateKey}
                className={`flex min-h-[76px] flex-col gap-0.5 rounded-[var(--radius)] border p-1.5 text-left ${
                  isToday ? "border-brand" : "border-border"
                } ${hasPending ? "bg-warning/5" : hasOnlyCompleted ? "bg-success/5" : "bg-bg"}`}
              >
                <span className={`text-xs ${isToday ? "font-bold text-brand" : "text-text-muted"}`}>{day}</span>
                {info ? (
                  <>
                    {hasPending ? (
                      <span className="text-[11px] font-medium text-warning">
                        {info.pendingCount} pendiente{info.pendingCount === 1 ? "" : "s"}
                      </span>
                    ) : null}
                    {info.completedCount > 0 ? (
                      <span className="text-[11px] font-medium text-success">
                        {info.completedCount} completado{info.completedCount === 1 ? "" : "s"}
                      </span>
                    ) : null}
                    {info.details.slice(0, 2).map((detail) => (
                      <span key={detail.id} className="truncate text-[11px] text-text-muted" title={detail.label}>
                        {detail.label}
                      </span>
                    ))}
                    {info.details.length > 2 ? <span className="text-[11px] text-text-muted">+{info.details.length - 2} más</span> : null}
                  </>
                ) : null}
              </div>
            );
          })}
        </div>

        <div className="mt-3 flex flex-wrap gap-4 text-xs text-text-muted">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-warning/40" /> Pendiente
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-success/40" /> Completado
          </span>
        </div>
      </section>

      <Link href="/tecnico/mantenimientos" className="text-sm font-medium text-brand hover:underline">
        Ver lista de mantenimientos
      </Link>
    </div>
  );
}
