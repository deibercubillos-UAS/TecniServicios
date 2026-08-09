import Image from "next/image";
import Link from "next/link";

const LEGAL_LINKS = [
  { href: "/politica-de-tratamiento-de-datos", label: "Tratamiento de datos" },
  { href: "/terminos-y-condiciones", label: "Términos y condiciones" },
  { href: "/garantia", label: "Garantía" },
  { href: "/envios-y-devoluciones", label: "Envíos y devoluciones" },
];

export function SiteFooter() {
  return (
    <footer className="bg-bg-inverse text-text-inverse">
      <div className="mx-auto flex max-w-[1280px] flex-col items-center gap-4 px-4 py-8 text-center md:px-6">
        <Image
          src="/brand/logo-mark.png"
          alt="Tecni Equipos y Servicios SAS"
          width={40}
          height={45}
          className="h-8 w-auto"
        />
        <p className="text-sm font-semibold">
          Soluciones que construyen confianza
        </p>
        <nav aria-label="Legal" className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-text-inverse-muted">
          {LEGAL_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-text-inverse hover:underline">
              {link.label}
            </Link>
          ))}
        </nav>
        <p className="text-xs text-text-inverse-muted">
          © {new Date().getFullYear()} Tecni Equipos y Servicios SAS
        </p>
      </div>
    </footer>
  );
}
