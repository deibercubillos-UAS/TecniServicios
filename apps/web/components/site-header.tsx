import Image from "next/image";
import Link from "next/link";

const NAV_LINKS = [
  { href: "/catalogo", label: "Catálogo" },
  { href: "/contacto", label: "Contacto" },
];

export function SiteHeader() {
  return (
    <header className="bg-bg-inverse text-text-inverse">
      <div className="mx-auto flex max-w-[1280px] items-center justify-between px-4 py-4 md:px-6">
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
        <nav aria-label="Principal">
          <ul className="flex items-center gap-6 text-sm">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-text-inverse-muted hover:text-text-inverse focus-visible:text-text-inverse focus-visible:outline-2 focus-visible:outline-brand"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
