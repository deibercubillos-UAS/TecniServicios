import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { createServerClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";
import { Icon, type IconName } from "@tecni/ui";

export const metadata: Metadata = {
  title: "Panel maestro — Tecni Equipos y Servicios SAS",
};

interface AuditLogRow {
  id: number;
  action: string;
  entity: string;
  created_at: string;
}

const QUICK_LINKS: { href: string; label: string; icon: IconName }[] = [
  { href: "/admin/mantenimientos", label: "Mantenimientos", icon: "wrench" },
  { href: "/admin/productos", label: "Productos", icon: "box" },
  { href: "/admin/categorias", label: "Categorías", icon: "sliders" },
  { href: "/admin/marcas", label: "Marcas", icon: "medal" },
  { href: "/admin/banners", label: "Banners", icon: "image" },
  { href: "/admin/promociones", label: "Promociones", icon: "bolt" },
  { href: "/admin/blog", label: "Blog", icon: "document" },
  { href: "/admin/usuarios", label: "Usuarios", icon: "user" },
  { href: "/admin/configuracion", label: "Configuración", icon: "gear" },
  { href: "/admin/metricas", label: "Métricas", icon: "calculator" },
  { href: "/admin/auditoria", label: "Auditoría", icon: "history" },
];

const AUDIT_ACTION_ICON: Record<string, IconName> = {
  role: "user",
  profile: "user",
  order: "truck",
  quote: "handshake",
  product: "box",
  maintenance_availability: "wrench",
  setting: "gear",
};

function auditIcon(action: string): IconName {
  const prefix = action.split(".")[0] ?? "";
  return AUDIT_ACTION_ICON[prefix] ?? "history";
}

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(serverEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    getAll: () => cookieStore.getAll(),
    setAll: () => {},
  });
}

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Buenos días";
  if (hour < 19) return "Buenas tardes";
  return "Buenas noches";
}

function StatCard({
  href,
  label,
  value,
  icon,
  tone = "brand",
}: {
  href: string;
  label: string;
  value: number;
  icon: IconName;
  tone?: "brand" | "warning";
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col gap-3 rounded-xl border border-border bg-surface p-5 transition-all duration-150 hover:-translate-y-0.5 hover:border-brand hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
    >
      <div className="flex items-center justify-between">
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-lg transition-transform duration-150 group-hover:scale-110 ${
            tone === "warning" ? "bg-warning/15 text-warning" : "bg-brand-subtle text-brand"
          }`}
        >
          <Icon name={icon} size={20} />
        </span>
        <Icon name="arrowRight" size={16} className="text-text-muted opacity-0 transition-opacity duration-150 group-hover:opacity-100" />
      </div>
      <div>
        <span className="block text-3xl font-extrabold tabular-nums text-text">{value}</span>
        <span className="text-sm text-text-muted">{label}</span>
      </div>
    </Link>
  );
}

export default async function AdminDashboardPage() {
  const supabase = await getSupabase();
  const { data: userData } = await supabase.auth.getUser();
  const { data: profileData } = userData.user
    ? await supabase.from("profiles").select("full_name").eq("id", userData.user.id).maybeSingle()
    : { data: null };
  const firstName = ((profileData?.full_name as string | undefined) ?? "").trim().split(" ")[0] || null;

  // Middleware ya exige master en /admin — master ve todo por RLS
  // (docs/05-RLS-SECURITY-A.md), sin filtros de alcance.
  const { count: pendingQuotesCount } = await supabase
    .from("quotes")
    .select("id", { count: "exact", head: true })
    .in("status", ["requested", "in_progress"]);
  const { count: pendingPaymentOrdersCount } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending_payment");
  const { count: openTicketsCount } = await supabase
    .from("support_tickets")
    .select("id", { count: "exact", head: true })
    .in("status", ["open", "assigned", "waiting_customer"]);
  const { count: unverifiedCompaniesCount } = await supabase
    .from("companies")
    .select("id", { count: "exact", head: true })
    .eq("is_verified", false);
  const { data: recentAuditData } = await supabase
    .from("audit_log")
    .select("id,action,entity,created_at")
    .order("created_at", { ascending: false })
    .limit(6);
  const recentAudit = (recentAuditData as AuditLogRow[] | null) ?? [];

  return (
    <div className="mx-auto flex max-w-[1000px] flex-col gap-8 px-4 py-12 sm:py-16">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold text-text">
          {greeting()}
          {firstName ? `, ${firstName}` : ""}
        </h1>
        <p className="text-sm text-text-muted">Resumen general de la plataforma.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard href="/ventas" label="Cotizaciones por atender" value={pendingQuotesCount ?? 0} icon="handshake" />
        <StatCard href="/ventas" label="Pedidos con pago pendiente" value={pendingPaymentOrdersCount ?? 0} icon="truck" tone="warning" />
        <StatCard href="/admin/auditoria" label="Tickets de soporte abiertos" value={openTicketsCount ?? 0} icon="chat" tone="warning" />
        <StatCard href="/admin/usuarios" label="Empresas sin verificar" value={unverifiedCompaniesCount ?? 0} icon="building" />
      </div>

      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-text-muted">Gestión</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {QUICK_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group flex items-center gap-3 rounded-xl border border-border bg-surface p-4 transition-all duration-150 hover:-translate-y-0.5 hover:border-brand hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-subtle text-brand transition-transform duration-150 group-hover:scale-110">
                <Icon name={link.icon} size={18} />
              </span>
              <span className="text-sm font-semibold text-text group-hover:text-brand">{link.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {recentAudit.length > 0 ? (
        <section className="rounded-xl border border-border bg-surface p-5">
          <h2 className="mb-4 flex items-center gap-2 font-bold text-text">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-subtle text-brand">
              <Icon name="history" size={16} />
            </span>
            Actividad reciente
          </h2>
          <ul className="flex flex-col gap-3">
            {recentAudit.map((entry) => (
              <li key={entry.id} className="flex items-center gap-3 text-sm">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-bg-alt text-text-muted">
                  <Icon name={auditIcon(entry.action)} size={14} />
                </span>
                <span className="flex-1 text-text-muted">
                  <span className="font-medium text-text">{entry.action}</span> · {entry.entity}
                </span>
                <span className="shrink-0 text-xs text-text-muted">{new Date(entry.created_at).toLocaleString("es-CO")}</span>
              </li>
            ))}
          </ul>
          <Link href="/admin/auditoria" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline">
            Ver auditoría completa
            <Icon name="arrowRight" size={14} />
          </Link>
        </section>
      ) : null}
    </div>
  );
}
