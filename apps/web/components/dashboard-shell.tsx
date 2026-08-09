"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@tecni/ui";

import type { DashboardNavSection } from "@/lib/dashboard-nav";

const COLLAPSE_STORAGE_KEY = "tecni-dashboard-collapsed";

const DASHBOARD_ROOTS = ["/mi-cuenta", "/ventas", "/tecnico", "/admin"];

function isActive(pathname: string, href: string): boolean {
  if (pathname === href) return true;
  if (DASHBOARD_ROOTS.includes(href)) return false;
  return pathname.startsWith(`${href}/`);
}

function NavSections({
  sections,
  pathname,
  collapsed,
  onNavigate = () => {},
}: {
  sections: DashboardNavSection[];
  pathname: string;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      {sections.map((section, i) => (
        <div key={section.label ?? i} className="flex flex-col gap-1">
          {section.label && !collapsed ? (
            <span className="px-3 text-[11px] font-bold uppercase tracking-wide text-text-muted">{section.label}</span>
          ) : null}
          <ul className="flex flex-col gap-0.5">
            {section.items.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    title={collapsed ? item.label : undefined}
                    aria-current={active ? "page" : undefined}
                    className={`group relative flex items-center gap-3 rounded-[var(--radius)] py-2.5 text-sm font-medium transition-all duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
                      collapsed ? "justify-center px-2" : "px-3"
                    } ${active ? "bg-brand-subtle text-brand" : "text-text-muted hover:bg-bg-alt hover:text-text"}`}
                  >
                    {active ? <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-brand" /> : null}
                    <Icon name={item.icon} size={18} className={active ? "text-brand" : "text-text-muted group-hover:text-text"} />
                    {collapsed ? null : item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}

function LogoutButton({ action, collapsed }: { action: () => Promise<void>; collapsed: boolean }) {
  return (
    <form action={action}>
      <button
        type="submit"
        title={collapsed ? "Cerrar sesión" : undefined}
        className={`flex w-full items-center gap-3 rounded-[var(--radius)] py-2.5 text-sm font-medium text-text-muted transition-colors hover:bg-bg-alt hover:text-danger focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
          collapsed ? "justify-center px-2" : "px-3"
        }`}
      >
        <Icon name="logOut" size={18} />
        {collapsed ? null : "Cerrar sesión"}
      </button>
    </form>
  );
}

export function DashboardShell({
  sections,
  accountLabel,
  roleLabel,
  logoutAction,
  children,
}: {
  sections: DashboardNavSection[];
  accountLabel: string;
  roleLabel: string;
  logoutAction: () => Promise<void>;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setCollapsed(window.localStorage.getItem(COLLAPSE_STORAGE_KEY) === "1");
    setHydrated(true);
  }, []);

  function toggleCollapsed() {
    setCollapsed((current) => {
      const next = !current;
      window.localStorage.setItem(COLLAPSE_STORAGE_KEY, next ? "1" : "0");
      return next;
    });
  }

  const initial = accountLabel.trim().charAt(0).toUpperCase() || "T";

  return (
    <div className="flex min-h-[calc(100vh-1px)] flex-col lg:flex-row">
      {/* Barra superior móvil */}
      <div className="flex items-center justify-between border-b border-border bg-surface px-4 py-3 lg:hidden">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-sm font-bold text-text-inverse">{initial}</span>
          <div className="flex flex-col leading-tight">
            <span className="truncate text-sm font-semibold text-text">{accountLabel}</span>
            <span className="text-[11px] text-text-muted">{roleLabel}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Abrir menú"
          aria-expanded={open}
          className="flex h-11 w-11 items-center justify-center rounded-[var(--radius)] text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          <Icon name="menu" size={22} />
        </button>
      </div>

      {/* Drawer móvil */}
      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button type="button" aria-label="Cerrar menú" onClick={() => setOpen(false)} className="absolute inset-0 bg-black/40" />
          <nav
            aria-label="Navegación del panel"
            className="absolute left-0 top-0 flex h-full w-72 max-w-[85vw] flex-col gap-5 overflow-y-auto bg-surface p-4 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-sm font-bold text-text-inverse">{initial}</span>
                <div className="flex flex-col leading-tight">
                  <span className="text-sm font-semibold text-text">{accountLabel}</span>
                  <span className="text-[11px] text-text-muted">{roleLabel}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Cerrar menú"
                className="flex h-11 w-11 items-center justify-center rounded-[var(--radius)] text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                <Icon name="close" size={20} />
              </button>
            </div>
            <NavSections sections={sections} pathname={pathname} collapsed={false} onNavigate={() => setOpen(false)} />
            <div className="mt-auto border-t border-border pt-4">
              <LogoutButton action={logoutAction} collapsed={false} />
            </div>
          </nav>
        </div>
      ) : null}

      {/* Sidebar escritorio */}
      <nav
        aria-label="Navegación del panel"
        className={`sticky top-0 hidden h-screen shrink-0 flex-col gap-5 border-r border-border bg-surface py-4 lg:flex ${
          collapsed ? "w-[76px] px-2" : "w-64 px-4"
        } ${hydrated ? "transition-[width] duration-200" : ""}`}
      >
        <div className={`flex items-center gap-2 px-1 ${collapsed ? "justify-center" : ""}`}>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-bold text-text-inverse">
            {initial}
          </span>
          {collapsed ? null : (
            <div className="flex min-w-0 flex-col leading-tight">
              <span className="truncate text-sm font-semibold text-text">{accountLabel}</span>
              <span className="text-[11px] text-text-muted">{roleLabel}</span>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          <NavSections sections={sections} pathname={pathname} collapsed={collapsed} />
        </div>

        <div className="flex flex-col gap-2 border-t border-border pt-3">
          <LogoutButton action={logoutAction} collapsed={collapsed} />
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Expandir menú" : "Ocultar menú"}
            className={`flex items-center gap-3 rounded-[var(--radius)] py-2.5 text-sm font-medium text-text-muted transition-colors hover:bg-bg-alt hover:text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
              collapsed ? "justify-center px-2" : "px-3"
            }`}
          >
            <Icon name={collapsed ? "chevronRight" : "chevronLeft"} size={18} />
            {collapsed ? null : "Ocultar menú"}
          </button>
        </div>
      </nav>

      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
