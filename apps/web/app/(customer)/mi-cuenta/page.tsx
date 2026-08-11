import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";
import { Icon, type IconName } from "@tecni/ui";

export const metadata: Metadata = {
  title: "Mi cuenta",
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
  hint,
  hintTone = "muted",
}: {
  href: string;
  label: string;
  value: number;
  icon: IconName;
  hint?: string | undefined;
  hintTone?: "muted" | "warning";
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col gap-3 rounded-xl border border-border bg-surface p-5 transition-all duration-150 hover:-translate-y-0.5 hover:border-brand hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
    >
      <div className="flex items-center justify-between">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-subtle text-brand transition-transform duration-150 group-hover:scale-110">
          <Icon name={icon} size={20} />
        </span>
        <Icon name="arrowRight" size={16} className="text-text-muted opacity-0 transition-opacity duration-150 group-hover:opacity-100" />
      </div>
      <div>
        <span className="block text-3xl font-extrabold tabular-nums text-text">{value}</span>
        <span className="text-sm text-text-muted">{label}</span>
      </div>
      {hint ? (
        <span
          className={`w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${
            hintTone === "warning" ? "bg-warning/15 text-warning" : "bg-bg-alt text-text-muted"
          }`}
        >
          {hint}
        </span>
      ) : null}
    </Link>
  );
}

export default async function MiCuentaPage() {
  const supabase = await getSupabase();

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    redirect("/login?next=/mi-cuenta");
  }

  const { data: profileData } = await supabase.from("profiles").select("full_name").eq("id", userData.user.id).maybeSingle();
  const firstName = ((profileData?.full_name as string | undefined) ?? "").trim().split(" ")[0] || null;

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
        <h1 className="mb-4 text-2xl font-bold text-text">{greeting()}{firstName ? `, ${firstName}` : ""}</h1>
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
    <div className="mx-auto flex max-w-[1000px] flex-col gap-8 px-4 py-12 sm:py-16">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold text-text">
          {greeting()}
          {firstName ? `, ${firstName}` : ""}
        </h1>
        <p className="text-sm text-text-muted">Este es el resumen de {company?.trade_name ?? company?.legal_name ?? "tu empresa"}.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          href="/pedidos"
          label="Pedidos"
          value={ordersCount ?? 0}
          icon="truck"
          hint={pendingOrdersCount ? `${pendingOrdersCount} con pago pendiente` : undefined}
          hintTone="warning"
        />
        <StatCard
          href="/cotizaciones"
          label="Cotizaciones"
          value={quotesCount ?? 0}
          icon="handshake"
          hint={pendingQuotesCount ? `${pendingQuotesCount} en proceso` : undefined}
        />
        <StatCard href="/mi-cuenta/equipos" label="Equipos" value={equipmentCount ?? 0} icon="box" />
        <StatCard href="/mi-cuenta/mantenimientos" label="Mantenimientos" value={maintenanceCount ?? 0} icon="wrench" />
        <StatCard href="/mi-cuenta/tickets" label="Tickets de soporte" value={ticketsCount ?? 0} icon="chat" />
        <Link
          href="/carrito"
          className="group flex flex-col items-start justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-bg-alt p-5 text-left transition-all duration-150 hover:-translate-y-0.5 hover:border-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand text-text-inverse transition-transform duration-150 group-hover:scale-110">
            <Icon name="cart" size={20} />
          </span>
          <span className="font-semibold text-text">Ir al carrito</span>
          <span className="text-xs text-text-muted">Continúa una compra en curso</span>
        </Link>
      </div>

      {company ? (
        <section className="rounded-xl border border-border bg-surface p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-bold text-text">
              <Icon name="building" size={18} className="text-text-muted" />
              {company.trade_name ?? company.legal_name}
            </h2>
            <span
              className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                company.is_verified ? "bg-success/15 text-success" : "bg-bg-alt text-text-muted"
              }`}
            >
              <Icon name={company.is_verified ? "checkCircle" : "clock"} size={12} />
              {company.is_verified ? "Verificada" : "Sin verificar"}
            </span>
          </div>
          <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
            <div className="flex justify-between border-b border-border/60 py-1.5 sm:border-none sm:py-0">
              <dt className="text-text-muted">Razón social</dt>
              <dd className="text-text">{company.legal_name}</dd>
            </div>
            <div className="flex justify-between border-b border-border/60 py-1.5 sm:border-none sm:py-0">
              <dt className="text-text-muted">{company.document_type}</dt>
              <dd className="text-text">{company.document_number}</dd>
            </div>
            {company.city ? (
              <div className="flex justify-between border-b border-border/60 py-1.5 sm:border-none sm:py-0">
                <dt className="text-text-muted">Ciudad</dt>
                <dd className="text-text">
                  {company.city}
                  {company.department ? `, ${company.department}` : ""}
                </dd>
              </div>
            ) : null}
            {company.phone ? (
              <div className="flex justify-between border-b border-border/60 py-1.5 sm:border-none sm:py-0">
                <dt className="text-text-muted">Teléfono</dt>
                <dd className="text-text">{company.phone}</dd>
              </div>
            ) : null}
            {company.email ? (
              <div className="flex justify-between py-1.5 sm:py-0">
                <dt className="text-text-muted">Correo</dt>
                <dd className="text-text">{company.email}</dd>
              </div>
            ) : null}
          </dl>
        </section>
      ) : null}

      <p className="text-sm text-text-muted">
        Las facturas están disponibles dentro de cada pedido ya pagado.{" "}
        <Link href="/pedidos" className="font-medium text-brand hover:underline">
          Ver mis pedidos
        </Link>
      </p>
    </div>
  );
}
