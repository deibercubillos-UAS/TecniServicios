"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@tecni/ui";

export interface CustomerNavItem {
  href: string;
  label: string;
  icon: IconName;
}

function isActive(pathname: string, href: string): boolean {
  return pathname === href || (href !== "/mi-cuenta" && pathname.startsWith(`${href}/`));
}

function NavLinks({ items, pathname, onNavigate = () => {} }: { items: CustomerNavItem[]; pathname: string; onNavigate?: () => void }) {
  return (
    <ul className="flex flex-col gap-1">
      {items.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 rounded-[var(--radius)] px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
                active ? "bg-brand-subtle text-brand" : "text-text-muted hover:bg-bg-alt hover:text-text"
              }`}
            >
              <Icon name={item.icon} size={18} className={active ? "text-brand" : "text-text-muted"} />
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function CustomerNav({
  items,
  accountLabel,
  onLogout,
}: {
  items: CustomerNavItem[];
  accountLabel: string;
  onLogout: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Barra superior móvil */}
      <div className="flex items-center justify-between border-b border-border bg-surface px-4 py-3 lg:hidden">
        <span className="truncate text-sm font-semibold text-text">{accountLabel}</span>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Abrir menú de mi cuenta"
          aria-expanded={open}
          className="flex h-11 w-11 items-center justify-center rounded-[var(--radius)] text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          <Icon name="menu" size={22} />
        </button>
      </div>

      {/* Drawer móvil */}
      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Cerrar menú"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/40"
          />
          <nav
            aria-label="Navegación de mi cuenta"
            className="absolute left-0 top-0 flex h-full w-72 max-w-[85vw] flex-col gap-4 overflow-y-auto bg-surface p-4 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-text">{accountLabel}</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Cerrar menú"
                className="flex h-11 w-11 items-center justify-center rounded-[var(--radius)] text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                <Icon name="close" size={20} />
              </button>
            </div>
            <NavLinks items={items} pathname={pathname} onNavigate={() => setOpen(false)} />
            <div className="mt-auto border-t border-border pt-4">{onLogout}</div>
          </nav>
        </div>
      ) : null}

      {/* Sidebar escritorio */}
      <nav aria-label="Navegación de mi cuenta" className="hidden w-64 shrink-0 flex-col gap-4 border-r border-border bg-surface p-4 lg:flex">
        <span className="px-1 text-sm font-semibold text-text">{accountLabel}</span>
        <NavLinks items={items} pathname={pathname} />
        <div className="mt-auto border-t border-border pt-4">{onLogout}</div>
      </nav>
    </>
  );
}
