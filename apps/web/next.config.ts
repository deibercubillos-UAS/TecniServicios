import type { NextConfig } from "next";

/**
 * Cabeceras de seguridad — docs/05-RLS-SECURITY-B.md sección 7. La
 * `Content-Security-Policy` NO va acá: necesita un nonce distinto por
 * request para permitir los scripts inline que Next.js inyecta al
 * hidratar, y `next.config.ts` solo puede generar cabeceras estáticas en
 * build. Vive en `middleware.ts` (`buildCsp`) — poner una CSP estática acá
 * además de la de middleware duplicaría la cabecera y el navegador
 * aplicaría la intersección de ambas, bloqueando igual (así se rompió en
 * producción: `script-src 'self'` sin nonce, página en blanco).
 */
const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "geolocation=(), microphone=(), camera=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
