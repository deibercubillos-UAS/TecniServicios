import type { MetadataRoute } from "next";
import { serverEnv } from "@tecni/shared";

export default function robots(): MetadataRoute.Robots {
  // Dominio de producción: tecnisas.co (docs/19-DEPLOYMENT.md sección 9).
  const baseUrl = serverEnv.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Rutas protegidas por rol (docs/06-AUTH-ROLES.md) no aportan nada a
      // un rastreador — nunca son alcanzables sin sesión de todos modos.
      disallow: ["/mi-cuenta", "/ventas", "/tecnico", "/admin", "/api/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
