import type { NextConfig } from "next";

/**
 * Cabeceras de seguridad — docs/05-RLS-SECURITY-B.md sección 7, paso 2.3
 * de ACTIVE-fase-6-endurecimiento-A.md. `connect-src` deriva la URL de
 * Supabase de `NEXT_PUBLIC_SUPABASE_URL` (inlineada en build, mismo dato
 * que ya es público en el cliente) — nunca un secreto acá. `wss:` cubre
 * Realtime sobre el mismo host. Sin `script-src` externo: la app no carga
 * ningún script de terceros todavía (Wompi sigue en `WompiMockClient`,
 * sin widget real embebido — ver progress/TODO.md).
 */
function buildCsp(): string {
  const supabaseUrl = process.env["NEXT_PUBLIC_SUPABASE_URL"] ?? "";
  const supabaseHost = supabaseUrl ? new URL(supabaseUrl).host : "";
  const connectSrc = ["'self'", supabaseUrl, supabaseHost ? `wss://${supabaseHost}` : ""].filter(Boolean).join(" ");

  return [
    "default-src 'self'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "style-src 'self' 'unsafe-inline'",
    "script-src 'self'",
    `connect-src ${connectSrc}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
}

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: buildCsp() },
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
