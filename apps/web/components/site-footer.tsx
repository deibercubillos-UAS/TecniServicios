import Image from "next/image";
import Link from "next/link";
import { Icon } from "@tecni/ui";
import { getContactSettings, isRealContactValue } from "../lib/contact-settings";

const LEGAL_LINKS = [
  { href: "/politica-de-tratamiento-de-datos", label: "Tratamiento de datos" },
  { href: "/terminos-y-condiciones", label: "Términos y condiciones" },
  { href: "/garantia", label: "Garantía" },
  { href: "/envios-y-devoluciones", label: "Envíos y devoluciones" },
];

const SITEMAP_LINKS = [
  { href: "/catalogo", label: "Catálogo" },
  { href: "/catalogo/categorias", label: "Categorías" },
  { href: "/blog", label: "Blog" },
  { href: "/calcula-tu-rentabilidad", label: "Calcula tu rentabilidad" },
  { href: "/contacto", label: "Contáctanos" },
];

/** Footer real — solo datos que existen en `settings` (mismas claves que
 * /contacto, vía `getContactSettings`). Cada dato se oculta si el master
 * no lo ha editado todavía (sigue en el placeholder sembrado) — nunca se
 * inventa una dirección o teléfono. Redes sociales y newsletter no
 * entran acá: no hay URLs reales ni backend de suscriptores todavía (ver
 * docs/tasks/done/DONE-cierre-brechas-ux-hunter.md, "Pendientes
 * descubiertos"). */
export async function SiteFooter() {
  const settings = await getContactSettings();

  const phone = settings["contact_phone"];
  const email = settings["contact_email"];
  const whatsapp = settings["contact_whatsapp"];
  const addressLine = settings["contact_address_line"];
  const addressCity = settings["contact_address_city"];
  const hoursWeekday = settings["contact_hours_weekday"];
  const hoursSaturday = settings["contact_hours_saturday"];

  const hasContactColumn = isRealContactValue(phone) || isRealContactValue(email) || isRealContactValue(whatsapp);
  const hasLocationColumn = isRealContactValue(addressLine) || isRealContactValue(hoursWeekday) || isRealContactValue(hoursSaturday);

  return (
    <footer className="bg-bg-inverse text-text-inverse">
      <div className="mx-auto grid max-w-[1280px] grid-cols-1 gap-10 px-4 py-12 md:grid-cols-4 md:px-6">
        <div className="flex flex-col items-start gap-3">
          <Image src="/brand/logo-mark.png" alt="Tecni Equipos y Servicios SAS" width={40} height={45} className="h-10 w-auto" />
          <p className="text-sm font-semibold">Soluciones que construyen confianza</p>
        </div>

        {hasContactColumn ? (
          <div className="flex flex-col gap-2 text-sm text-text-inverse-muted">
            <h2 className="mb-1 font-semibold text-text-inverse">Contacto</h2>
            {isRealContactValue(phone) ? (
              <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} className="flex items-center gap-2 hover:text-text-inverse hover:underline">
                <Icon name="phone" size={16} />
                {phone}
              </a>
            ) : null}
            {isRealContactValue(whatsapp) ? (
              <a
                href={`https://wa.me/${whatsapp.replace(/\D/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 hover:text-text-inverse hover:underline"
              >
                <Icon name="chat" size={16} />
                WhatsApp
              </a>
            ) : null}
            {isRealContactValue(email) ? (
              <a href={`mailto:${email}`} className="flex items-center gap-2 hover:text-text-inverse hover:underline">
                <Icon name="mail" size={16} />
                {email}
              </a>
            ) : null}
          </div>
        ) : null}

        {hasLocationColumn ? (
          <div className="flex flex-col gap-2 text-sm text-text-inverse-muted">
            <h2 className="mb-1 font-semibold text-text-inverse">Ubicación y horario</h2>
            {isRealContactValue(addressLine) ? (
              <p className="flex items-start gap-2">
                <Icon name="mapPin" size={16} className="mt-0.5 shrink-0" />
                <span>
                  {addressLine}
                  {isRealContactValue(addressCity) ? `, ${addressCity}` : ""}
                </span>
              </p>
            ) : null}
            {isRealContactValue(hoursWeekday) ? (
              <p className="flex items-start gap-2">
                <Icon name="clock" size={16} className="mt-0.5 shrink-0" />
                <span>
                  Lun-Vie: {hoursWeekday}
                  {isRealContactValue(hoursSaturday) ? ` · Sáb: ${hoursSaturday}` : ""}
                </span>
              </p>
            ) : null}
          </div>
        ) : null}

        <nav aria-label="Mapa del sitio" className="flex flex-col gap-2 text-sm text-text-inverse-muted">
          <h2 className="mb-1 font-semibold text-text-inverse">Explora</h2>
          {SITEMAP_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-text-inverse hover:underline">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="border-t border-border-inverse">
        <div className="mx-auto flex max-w-[1280px] flex-col items-center gap-3 px-4 py-6 text-center md:px-6">
          <nav aria-label="Legal" className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-text-inverse-muted">
            {LEGAL_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-text-inverse hover:underline">
                {link.label}
              </Link>
            ))}
          </nav>
          <p className="text-xs text-text-inverse-muted">© {new Date().getFullYear()} Tecni Equipos y Servicios SAS</p>
        </div>
      </div>
    </footer>
  );
}
