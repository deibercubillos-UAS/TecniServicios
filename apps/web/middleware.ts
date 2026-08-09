import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";

/** Exacto a docs/06-AUTH-ROLES.md sección 5. */
const ROUTE_RULES: { prefix: string; roles: string[] }[] = [
  { prefix: "/mi-cuenta", roles: ["customer", "master"] },
  { prefix: "/ventas", roles: ["seller", "master"] },
  { prefix: "/tecnico", roles: ["technician", "master"] },
  { prefix: "/admin", roles: ["master"] },
  { prefix: "/api/v1/admin", roles: ["master"] },
];

function matchRule(pathname: string): { prefix: string; roles: string[] } | undefined {
  return ROUTE_RULES.find((rule) => pathname === rule.prefix || pathname.startsWith(`${rule.prefix}/`));
}

/**
 * CSP con nonce por request — docs/05-RLS-SECURITY-B.md sección 7. La CSP
 * estática que vivía en `next.config.ts` bloqueaba en producción los
 * scripts inline que Next.js inyecta para hidratar (`script-src 'self'`
 * sin nonce ni `unsafe-inline`, página completa en blanco). `next.config.ts`
 * no puede generar un valor distinto por request — un nonce solo puede
 * venir de acá. Next.js detecta el nonce en la cabecera `Content-Security-
 * Policy` de la respuesta y lo aplica automáticamente a sus propios
 * scripts, sin tocar código de cada página.
 */
function buildCsp(nonce: string): string {
  const supabaseUrl = serverEnv.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseHost = supabaseUrl ? new URL(supabaseUrl).host : "";
  const connectSrc = ["'self'", supabaseUrl, supabaseHost ? `wss://${supabaseHost}` : ""].filter(Boolean).join(" ");

  return [
    "default-src 'self'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "style-src 'self' 'unsafe-inline'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    `connect-src ${connectSrc}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
}

/** Decodifica el payload del JWT sin verificar la firma — la cookie de
 * sesión es httpOnly y solo la escribe nuestro propio servidor (SDK de
 * Supabase); no se re-valida contra la base de datos a propósito (regla
 * de 06-AUTH-ROLES.md sección 5: "el middleware no consulta la base de
 * datos"). El claim `user_role` lo agrega el hook de la Fase 7. */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    return JSON.parse(atob(padded)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname, search } = request.nextUrl;

  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = buildCsp(nonce);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const rule = matchRule(pathname);
  if (!rule) {
    const response = NextResponse.next({ request: { headers: requestHeaders } });
    response.headers.set("Content-Security-Policy", csp);
    return response;
  }

  let response = NextResponse.next({ request: { headers: requestHeaders } });

  const authClient = createServerClient(
    serverEnv.NEXT_PUBLIC_SUPABASE_URL,
    serverEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        for (const { name, value } of list) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request: { headers: requestHeaders } });
        for (const { name, value, options } of list) {
          response.cookies.set(name, value, options);
        }
      },
    },
  );

  const {
    data: { session },
  } = await authClient.auth.getSession();

  if (!session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname + search);
    const redirect = NextResponse.redirect(loginUrl);
    redirect.headers.set("Content-Security-Policy", csp);
    return redirect;
  }

  if (!session.user.email_confirmed_at) {
    const redirect = NextResponse.redirect(new URL("/verificar", request.url));
    redirect.headers.set("Content-Security-Policy", csp);
    return redirect;
  }

  const claims = decodeJwtPayload(session.access_token);
  const userRole = typeof claims?.["user_role"] === "string" ? (claims["user_role"] as string) : null;

  if (!userRole || !rule.roles.includes(userRole)) {
    const redirect = NextResponse.redirect(new URL("/403", request.url));
    redirect.headers.set("Content-Security-Policy", csp);
    return redirect;
  }

  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
