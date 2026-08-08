import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import { createServerClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";
import { Icon } from "@tecni/ui";

/** Exacto a los enlaces reales del sitio — el navbar de
 * `design/stitch/home/code.html` traía menús desplegables
 * (Productos/Servicios/Marcas) sin submenú real detrás y un carrito con un
 * contador fabricado ("3"): ninguno de los dos se reconstruye (mismo
 * criterio de honestidad de contenido que la home, ver
 * docs/17-STITCH-MIGRATION.md paso 6.2 / docs/tasks/ACTIVE-fase-2-
 * catalogo-publico-B.md). Solo enlaces a rutas que existen. */
const NAV_LINKS = [
  { href: "/catalogo", label: "Catálogo" },
  { href: "/contacto", label: "Contacto" },
];

async function getUserEmail(): Promise<string | null> {
  const cookieStore = await cookies();
  const authClient = createServerClient(
    serverEnv.NEXT_PUBLIC_SUPABASE_URL,
    serverEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { getAll: () => cookieStore.getAll(), setAll: () => {} },
  );
  const { data } = await authClient.auth.getUser();
  return data.user?.email ?? null;
}

export async function SiteHeader() {
  const email = await getUserEmail();

  return (
    <header className="sticky top-0 z-50 border-b-4 border-brand bg-bg-inverse text-text-inverse shadow-md">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-3 px-4 py-3 md:px-6">
        <div className="flex items-center justify-between gap-8">
          <Link href="/" className="shrink-0">
            <Image
              src="/brand/logo-full-dark.png"
              alt="Tecni Equipos y Servicios SAS"
              width={160}
              height={40}
              priority
              className="h-8 w-auto md:h-10"
            />
          </Link>

          <form
            action="/catalogo"
            method="get"
            className="hidden max-w-xl flex-1 items-center md:flex"
          >
            <div className="relative w-full">
              <Icon
                name="search"
                size={18}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-inverse-muted"
              />
              <input
                type="text"
                name="q"
                placeholder="Buscar equipos, herramientas, referencias..."
                className="w-full rounded-[var(--radius)] border border-border-inverse bg-bg-inverse py-2 pl-10 pr-4 text-sm text-text-inverse placeholder:text-text-inverse-muted focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </div>
          </form>

          <div className="flex items-center gap-6">
            <nav aria-label="Principal" className="hidden lg:block">
              <ul className="flex items-center gap-6 text-sm">
                {NAV_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="font-medium text-text-inverse-muted transition-colors hover:text-text-inverse focus-visible:text-text-inverse focus-visible:outline-2 focus-visible:outline-brand"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="flex items-center gap-3 border-l border-border-inverse pl-6">
              {email ? (
                <span className="hidden text-sm text-text-inverse-muted sm:inline">{email}</span>
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

        <form action="/catalogo" method="get" className="md:hidden">
          <div className="relative w-full">
            <Icon
              name="search"
              size={18}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-inverse-muted"
            />
            <input
              type="text"
              name="q"
              placeholder="Buscar..."
              className="w-full rounded-[var(--radius)] border border-border-inverse bg-bg-inverse py-2 pl-10 pr-4 text-sm text-text-inverse placeholder:text-text-inverse-muted focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>
        </form>
      </div>
    </header>
  );
}
