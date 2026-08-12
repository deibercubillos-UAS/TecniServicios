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
  // Server Actions validan el header Origin contra el host — sin esta
  // lista, detrás del proxy de Cloudflare (dominio custom) el check falla
  // y responde 403 genérico ("An unexpected response was received").
  //
  // bodySizeLimit: el default de Next.js es 1 MB — muy poco para subir
  // fotos de producto ("Body exceeded 1 MB limit."). Vercel además pone
  // un tope propio de 4.5 MB por request en funciones Serverless (todos
  // los planes no-Enterprise), así que 4mb es el máximo real utilizable,
  // no una elección arbitraria. Subir varias fotos grandes a la vez
  // sigue pudiendo superar el límite — el admin debe subirlas en tandas
  // pequeñas si son varias fotos pesadas.
  experimental: {
    serverActions: {
      allowedOrigins: ["tecnisas.co", "www.tecnisas.co"],
      bodySizeLimit: "4mb",
    },
  },
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
