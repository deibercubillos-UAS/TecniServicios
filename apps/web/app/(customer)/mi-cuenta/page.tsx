import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";

export const metadata: Metadata = {
  title: "Mi cuenta — Tecni Equipos y Servicios SAS",
};

interface CompanyRow {
  legal_name: string;
  trade_name: string | null;
  document_type: string;
  document_number: string;
  address: string | null;
  city: string | null;
  department: string | null;
  phone: string | null;
  email: string | null;
  is_verified: boolean;
}

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(serverEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    getAll: () => cookieStore.getAll(),
    setAll: () => {},
  });
}

export default async function MiCuentaPage() {
  const supabase = await getSupabase();

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    redirect("/login?next=/mi-cuenta");
  }

  const { data: membership } = await supabase
    .from("company_members")
    .select("company_id")
    .eq("profile_id", userData.user.id)
    .order("is_primary", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!membership) {
    return (
      <div className="mx-auto max-w-[800px] px-4 py-16">
        <h1 className="mb-4 text-2xl font-bold text-text">Mi cuenta</h1>
        <p className="text-text-muted">Tu cuenta todavía no está asociada a una empresa.</p>
      </div>
    );
  }

  const companyId = membership["company_id"] as string;

  const { data: companyData } = await supabase
    .from("companies")
    .select("legal_name,trade_name,document_type,document_number,address,city,department,phone,email,is_verified")
    .eq("id", companyId)
    .maybeSingle();
  const company = companyData as CompanyRow | null;

  const { count: ordersCount } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("company_id", companyId);
  const { count: pendingOrdersCount } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("company_id", companyId)
    .eq("status", "pending_payment");
  const { count: quotesCount } = await supabase
    .from("quotes")
    .select("id", { count: "exact", head: true })
    .eq("company_id", companyId);
  const { count: pendingQuotesCount } = await supabase
    .from("quotes")
    .select("id", { count: "exact", head: true })
    .eq("company_id", companyId)
    .in("status", ["requested", "in_progress", "sent"]);
  const { count: equipmentCount } = await supabase
    .from("owned_equipment")
    .select("id", { count: "exact", head: true })
    .eq("company_id", companyId);
  const { count: maintenanceCount } = await supabase
    .from("maintenance_requests")
    .select("id", { count: "exact", head: true })
    .eq("company_id", companyId);
  const { count: ticketsCount } = await supabase
    .from("support_tickets")
    .select("id", { count: "exact", head: true })
    .eq("company_id", companyId);

  return (
    <div className="mx-auto flex max-w-[800px] flex-col gap-6 px-4 py-16">
      <h1 className="text-2xl font-bold text-text">Mi cuenta</h1>

      {company ? (
        <section className="rounded-lg border border-border p-4">
          <h2 className="mb-2 font-semibold text-text">{company.trade_name ?? company.legal_name}</h2>
          <dl className="flex flex-col gap-1 text-sm">
            <div className="flex justify-between">
              <dt className="text-text-muted">Razón social</dt>
              <dd className="text-text">{company.legal_name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-text-muted">{company.document_type}</dt>
              <dd className="text-text">{company.document_number}</dd>
            </div>
            {company.city ? (
              <div className="flex justify-between">
                <dt className="text-text-muted">Ciudad</dt>
                <dd className="text-text">
                  {company.city}
                  {company.department ? `, ${company.department}` : ""}
                </dd>
              </div>
            ) : null}
            {company.phone ? (
              <div className="flex justify-between">
                <dt className="text-text-muted">Teléfono</dt>
                <dd className="text-text">{company.phone}</dd>
              </div>
            ) : null}
            {company.email ? (
              <div className="flex justify-between">
                <dt className="text-text-muted">Correo</dt>
                <dd className="text-text">{company.email}</dd>
              </div>
            ) : null}
            <div className="flex justify-between">
              <dt className="text-text-muted">Estado</dt>
              <dd className="text-text">{company.is_verified ? "Verificada" : "Sin verificar"}</dd>
            </div>
          </dl>
        </section>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link href="/pedidos" className="flex flex-col gap-1 rounded-lg border border-border p-4 hover:border-brand">
          <span className="text-sm text-text-muted">Pedidos</span>
          <span className="text-2xl font-bold text-text">{ordersCount ?? 0}</span>
          {pendingOrdersCount ? <span className="text-xs text-text-muted">{pendingOrdersCount} con pago pendiente</span> : null}
        </Link>
        <Link href="/cotizaciones" className="flex flex-col gap-1 rounded-lg border border-border p-4 hover:border-brand">
          <span className="text-sm text-text-muted">Cotizaciones</span>
          <span className="text-2xl font-bold text-text">{quotesCount ?? 0}</span>
          {pendingQuotesCount ? <span className="text-xs text-text-muted">{pendingQuotesCount} en proceso</span> : null}
        </Link>
        <Link href="/mi-cuenta/equipos" className="flex flex-col gap-1 rounded-lg border border-border p-4 hover:border-brand">
          <span className="text-sm text-text-muted">Equipos</span>
          <span className="text-2xl font-bold text-text">{equipmentCount ?? 0}</span>
        </Link>
        <Link href="/mi-cuenta/mantenimientos" className="flex flex-col gap-1 rounded-lg border border-border p-4 hover:border-brand">
          <span className="text-sm text-text-muted">Mantenimientos</span>
          <span className="text-2xl font-bold text-text">{maintenanceCount ?? 0}</span>
        </Link>
        <Link href="/mi-cuenta/tickets" className="flex flex-col gap-1 rounded-lg border border-border p-4 hover:border-brand">
          <span className="text-sm text-text-muted">Tickets de soporte</span>
          <span className="text-2xl font-bold text-text">{ticketsCount ?? 0}</span>
        </Link>
      </div>

      <p className="text-sm text-text-muted">
        Las facturas están disponibles dentro de cada pedido ya pagado.{" "}
        <Link href="/pedidos" className="text-brand hover:underline">
          Ver mis pedidos
        </Link>
      </p>

      <Link href="/carrito" className="text-sm text-brand hover:underline">
        Ir al carrito
      </Link>

      <Link href="/mi-cuenta/privacidad" className="text-sm text-brand hover:underline">
        Mis datos personales y solicitud de supresión
      </Link>
    </div>
  );
}
