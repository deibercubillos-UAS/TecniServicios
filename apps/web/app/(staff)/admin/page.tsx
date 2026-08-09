import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { createServerClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";

export const metadata: Metadata = {
  title: "Panel maestro — Tecni Equipos y Servicios SAS",
};

interface AuditLogRow {
  id: number;
  action: string;
  entity: string;
  created_at: string;
}

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(serverEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    getAll: () => cookieStore.getAll(),
    setAll: () => {},
  });
}

export default async function AdminDashboardPage() {
  const supabase = await getSupabase();

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
    .limit(5);
  const recentAudit = (recentAuditData as AuditLogRow[] | null) ?? [];

  return (
    <div className="mx-auto flex max-w-[900px] flex-col gap-6 px-4 py-16">
      <div>
        <h1 className="text-2xl font-bold text-text">Panel maestro</h1>
        <p className="text-sm text-text-muted">Resumen general de la plataforma.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link href="/ventas" className="flex flex-col gap-1 rounded-lg border border-border p-4 hover:border-brand">
          <span className="text-sm text-text-muted">Cotizaciones por atender</span>
          <span className="text-2xl font-bold text-text">{pendingQuotesCount ?? 0}</span>
        </Link>
        <Link href="/ventas" className="flex flex-col gap-1 rounded-lg border border-border p-4 hover:border-brand">
          <span className="text-sm text-text-muted">Pedidos con pago pendiente</span>
          <span className="text-2xl font-bold text-text">{pendingPaymentOrdersCount ?? 0}</span>
        </Link>
        <Link href="/admin/auditoria" className="flex flex-col gap-1 rounded-lg border border-border p-4 hover:border-brand">
          <span className="text-sm text-text-muted">Tickets de soporte abiertos</span>
          <span className="text-2xl font-bold text-text">{openTicketsCount ?? 0}</span>
        </Link>
        <div className="flex flex-col gap-1 rounded-lg border border-border p-4">
          <span className="text-sm text-text-muted">Empresas sin verificar</span>
          <span className="text-2xl font-bold text-text">{unverifiedCompaniesCount ?? 0}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Link href="/admin/productos" className="rounded-lg border border-border p-3 text-center text-sm font-medium text-text hover:border-brand">
          Productos
        </Link>
        <Link href="/admin/categorias" className="rounded-lg border border-border p-3 text-center text-sm font-medium text-text hover:border-brand">
          Categorías
        </Link>
        <Link href="/admin/marcas" className="rounded-lg border border-border p-3 text-center text-sm font-medium text-text hover:border-brand">
          Marcas
        </Link>
        <Link href="/admin/banners" className="rounded-lg border border-border p-3 text-center text-sm font-medium text-text hover:border-brand">
          Banners
        </Link>
        <Link href="/admin/promociones" className="rounded-lg border border-border p-3 text-center text-sm font-medium text-text hover:border-brand">
          Promociones
        </Link>
        <Link href="/admin/blog" className="rounded-lg border border-border p-3 text-center text-sm font-medium text-text hover:border-brand">
          Blog
        </Link>
        <Link href="/admin/usuarios" className="rounded-lg border border-border p-3 text-center text-sm font-medium text-text hover:border-brand">
          Usuarios
        </Link>
        <Link href="/admin/configuracion" className="rounded-lg border border-border p-3 text-center text-sm font-medium text-text hover:border-brand">
          Configuración
        </Link>
        <Link href="/admin/metricas" className="rounded-lg border border-border p-3 text-center text-sm font-medium text-text hover:border-brand">
          Métricas
        </Link>
        <Link href="/admin/auditoria" className="rounded-lg border border-border p-3 text-center text-sm font-medium text-text hover:border-brand">
          Auditoría
        </Link>
      </div>

      {recentAudit.length > 0 ? (
        <div className="rounded-lg border border-border p-4">
          <h2 className="mb-3 text-sm font-bold text-text">Actividad reciente</h2>
          <ul className="flex flex-col gap-2 text-sm">
            {recentAudit.map((entry) => (
              <li key={entry.id} className="flex justify-between text-text-muted">
                <span>
                  <span className="font-medium text-text">{entry.action}</span> · {entry.entity}
                </span>
                <span>{new Date(entry.created_at).toLocaleString("es-CO")}</span>
              </li>
            ))}
          </ul>
          <Link href="/admin/auditoria" className="mt-3 inline-block text-sm text-brand hover:underline">
            Ver auditoría completa
          </Link>
        </div>
      ) : null}
    </div>
  );
}
