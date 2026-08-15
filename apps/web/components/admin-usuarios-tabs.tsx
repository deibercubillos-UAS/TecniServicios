import Link from "next/link";

const TABS = [
  { key: "equipo", label: "Equipo", href: "/admin/usuarios" },
  { key: "clientes", label: "Clientes", href: "/admin/usuarios/clientes" },
] as const;

/** Server-rendered a propósito — cada pestaña es una ruta real
 * (mismo criterio que el resto del panel admin, ver /admin/banners),
 * no un tab client-side. `active` lo pasa cada página según su propia
 * ruta. */
export function AdminUsuariosTabs({ active }: { active: "equipo" | "clientes" }) {
  return (
    <div role="tablist" className="flex gap-1 border-b border-border">
      {TABS.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          role="tab"
          aria-selected={active === tab.key}
          className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
            active === tab.key ? "border-brand text-brand" : "border-transparent text-text-muted hover:text-text"
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
