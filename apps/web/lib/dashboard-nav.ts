import type { IconName } from "@tecni/ui";

export type DashboardRole = "customer" | "seller" | "technician" | "master";

export interface DashboardNavItem {
  href: string;
  label: string;
  icon: IconName;
}

export interface DashboardNavSection {
  label?: string;
  items: DashboardNavItem[];
}

export const ROLE_LABEL: Record<DashboardRole, string> = {
  customer: "Cliente",
  seller: "Ventas",
  technician: "Técnico",
  master: "Administrador",
};

/** Rol interno dentro de la empresa (docs/06-AUTH-ROLES.md sección 3) —
 * distinto del `DashboardRole` de plataforma. */
export const COMPANY_MEMBER_ROLE_LABEL: Record<string, string> = {
  owner: "Propietario",
  buyer: "Comprador",
  accounting: "Contabilidad",
  workshop: "Taller",
};

/**
 * Un solo mapa de navegación por rol — la base compartida que pidió el
 * usuario para que todos los dashboards (customer/seller/technician/master)
 * usen el mismo `DashboardShell`. Solo enlaza a rutas que ya existen; nunca
 * un ítem "de adorno" sin página real detrás.
 */
export function getDashboardNav(role: DashboardRole): DashboardNavSection[] {
  switch (role) {
    case "customer":
      return [
        {
          items: [
            { href: "/mi-cuenta", label: "Panel", icon: "home" },
            { href: "/pedidos", label: "Pedidos", icon: "truck" },
            { href: "/cotizaciones", label: "Cotizaciones", icon: "handshake" },
            { href: "/carrito", label: "Carrito", icon: "cart" },
          ],
        },
        {
          label: "Mis equipos",
          items: [
            { href: "/mi-cuenta/equipos", label: "Equipos", icon: "box" },
            { href: "/mi-cuenta/mantenimientos", label: "Mantenimientos", icon: "wrench" },
            { href: "/mi-cuenta/manuales", label: "Manuales", icon: "document" },
            { href: "/mi-cuenta/tickets", label: "Soporte", icon: "chat" },
          ],
        },
        {
          label: "Cuenta",
          items: [{ href: "/mi-cuenta/privacidad", label: "Mis datos", icon: "shield" }],
        },
      ];
    case "seller":
      return [
        {
          items: [
            { href: "/ventas", label: "Panel", icon: "home" },
            { href: "/ventas/pedidos", label: "Pedidos", icon: "truck" },
            { href: "/cotizaciones", label: "Cotizaciones", icon: "handshake" },
            { href: "/carrito", label: "Carrito", icon: "cart" },
          ],
        },
        {
          label: "Catálogo",
          items: [{ href: "/catalogo", label: "Catálogo", icon: "box" }],
        },
      ];
    case "technician":
      return [
        {
          items: [
            { href: "/tecnico", label: "Panel", icon: "home" },
            { href: "/tecnico/mantenimientos", label: "Mantenimientos", icon: "wrench" },
            { href: "/tecnico/tickets", label: "Tickets", icon: "chat" },
          ],
        },
      ];
    case "master":
      return [
        {
          items: [
            { href: "/admin", label: "Panel", icon: "home" },
            { href: "/admin/pedidos", label: "Pedidos", icon: "truck" },
            { href: "/admin/cotizaciones", label: "Cotizaciones", icon: "handshake" },
          ],
        },
        {
          label: "Catálogo",
          items: [
            { href: "/admin/productos", label: "Productos", icon: "box" },
            { href: "/admin/categorias", label: "Categorías", icon: "sliders" },
            { href: "/admin/marcas", label: "Marcas", icon: "medal" },
          ],
        },
        {
          label: "Contenido",
          items: [
            { href: "/admin/banners", label: "Banners", icon: "image" },
            { href: "/admin/promociones", label: "Promociones", icon: "bolt" },
            { href: "/admin/blog", label: "Blog", icon: "document" },
          ],
        },
        {
          label: "Administración",
          items: [
            { href: "/admin/mantenimientos", label: "Mantenimientos", icon: "wrench" },
            { href: "/admin/usuarios", label: "Usuarios", icon: "user" },
            { href: "/admin/configuracion", label: "Configuración", icon: "gear" },
            { href: "/admin/metricas", label: "Métricas", icon: "calculator" },
            { href: "/admin/auditoria", label: "Auditoría", icon: "history" },
          ],
        },
      ];
  }
}
