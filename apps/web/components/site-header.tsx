import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import { createServerClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";
import { Icon, buttonClass } from "@tecni/ui";
import { signOutAction } from "@/app/actions/auth";
import { CartTrigger } from "./cart-drawer/cart-trigger";
import { CatalogNavDropdown } from "./catalog-nav-dropdown";
import { CATEGORY_ICON } from "../lib/category-icons";

/** Cada rol de plataforma tiene un panel real distinto — nunca se manda
 * a todos a /mi-cuenta (esa ruta es solo del grupo (customer)). */
const ACCOUNT_HREF_BY_ROLE: Record<string, string> = {
  customer: "/mi-cuenta",
  seller: "/ventas",
  technician: "/tecnico",
  master: "/admin",
};

/** Exacto a los enlaces reales del sitio — el navbar de
 * `design/stitch/home/code.html` traía menús desplegables
 * (Productos/Servicios/Marcas) sin submenú real detrás y un carrito con un
 * contador fabricado ("3"): ninguno de los dos se reconstruye (mismo
 * criterio de honestidad de contenido que la home, ver
 * docs/17-STITCH-MIGRATION.md paso 6.2 / docs/tasks/ACTIVE-fase-2-
 * catalogo-publico-B.md). Solo enlaces a rutas que existen. El contador
 * del carrito acá sí es real: cuenta `cart_items` del usuario, nunca un
 * número fijo. */
const NAV_LINKS = [
  { href: "/contacto", label: "Contáctanos" },
  { href: "/blog", label: "Blog" },
  { href: "/calcula-tu-rentabilidad", label: "Calcula tu rentabilidad" },
];

async function getUserAndCart(): Promise<{ displayName: string | null; accountHref: string; cartItemCount: number }> {
  const cookieStore = await cookies();
  const authClient = createServerClient(
    serverEnv.NEXT_PUBLIC_SUPABASE_URL,
    serverEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { getAll: () => cookieStore.getAll(), setAll: () => {} },
  );
  const { data: userData } = await authClient.auth.getUser();
  if (!userData.user) {
    return { displayName: null, accountHref: "/mi-cuenta", cartItemCount: 0 };
  }

  const [{ data: profile }, { data: membership }] = await Promise.all([
    authClient.from("profiles").select("role,full_name").eq("id", userData.user.id).maybeSingle(),
    authClient.from("company_members").select("company_id").eq("profile_id", userData.user.id).order("is_primary", { ascending: false }).limit(1).maybeSingle(),
  ]);
  const role = (profile?.["role"] as string | undefined) ?? "customer";
  const accountHref = ACCOUNT_HREF_BY_ROLE[role] ?? "/mi-cuenta";
  const displayName = (profile?.["full_name"] as string | undefined) || userData.user.email || null;

  if (!membership) {
    return { displayName, accountHref, cartItemCount: 0 };
  }

  // El carrito es por empresa (docs/13-MODULE-COMMERCE.md), no por usuario
  // — cualquier compañero puede haberlo creado. Consultar por `profile_id`
  // acá subestimaba el contador para todos menos quien lo creó.
  const { data: cart } = await authClient.from("carts").select("id").eq("company_id", membership["company_id"] as string).limit(1).maybeSingle();
  if (!cart) {
    return { displayName, accountHref, cartItemCount: 0 };
  }

  const { count } = await authClient
    .from("cart_items")
    .select("id", { count: "exact", head: true })
    .eq("cart_id", cart["id"] as string);

  return { displayName, accountHref, cartItemCount: count ?? 0 };
}

async function getCatalogCategories(): Promise<{ slug: string; name: string }[]> {
  const cookieStore = await cookies();
  const client = createServerClient(
    serverEnv.NEXT_PUBLIC_SUPABASE_URL,
    serverEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { getAll: () => cookieStore.getAll(), setAll: () => {} },
  );
  const { data } = await client.from("categories").select("slug,name").eq("is_active", true).order("position");
  return (data as { slug: string; name: string }[] | null) ?? [];
}

export async function SiteHeader() {
  const [{ displayName, accountHref, cartItemCount }, categories] = await Promise.all([
    getUserAndCart(),
    getCatalogCategories(),
  ]);

  return (
    <header className="sticky top-0 z-50 bg-bg-inverse text-text-inverse shadow-md">
      <div className="mx-auto max-w-[1280px] px-4 py-3 md:px-6">
        <div className="flex items-center justify-between gap-8">
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <Image src="/brand/logo-mark.png" alt="" width={40} height={45} priority className="h-8 w-auto md:h-10" />
            <span className="hidden text-base font-bold leading-tight sm:block">
              Tecni Equipos
              <br />y Servicios SAS
            </span>
          </Link>

          <div className="flex items-center gap-6">
            <nav aria-label="Principal" className="hidden lg:block">
              <ul className="flex items-center gap-6 text-sm">
                <li>
                  <CatalogNavDropdown
                    categories={categories.map((category) => ({
                      slug: category.slug,
                      name: category.name,
                      icon: CATEGORY_ICON[category.slug] ?? "box",
                    }))}
                  />
                </li>
                {NAV_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="font-bold uppercase tracking-wide text-text-inverse-muted transition-colors hover:text-text-inverse focus-visible:text-text-inverse focus-visible:outline-2 focus-visible:outline-brand"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="flex items-center gap-4 border-l border-border-inverse pl-6">
              <CartTrigger count={cartItemCount} />

              {displayName ? (
                <div className="flex items-center gap-3">
                  <Link
                    href={accountHref}
                    aria-label="Mi cuenta"
                    className="flex h-11 w-11 items-center justify-center rounded-full text-text-inverse-muted transition-colors hover:text-text-inverse focus-visible:text-text-inverse focus-visible:outline-2 focus-visible:outline-brand"
                  >
                    <Icon name="user" size={20} />
                  </Link>
                  <form action={signOutAction}>
                    <button type="submit" className={buttonClass("primary", "px-4 py-2 text-xs uppercase tracking-wide")}>
                      Cerrar sesión
                    </button>
                  </form>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center gap-2 rounded-[var(--radius)] bg-brand px-4 py-2 text-sm font-semibold text-text-inverse transition-colors hover:bg-brand-hover"
                >
                  <Icon name="user" size={18} />
                  Iniciar sesión
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
