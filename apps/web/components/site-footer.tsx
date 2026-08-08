import Image from "next/image";

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
        <p className="text-xs text-text-inverse-muted">
          © {new Date().getFullYear()} Tecni Equipos y Servicios SAS
        </p>
      </div>
    </footer>
  );
}
