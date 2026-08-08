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
  const rule = matchRule(pathname);
  if (!rule) return NextResponse.next();

  let response = NextResponse.next({ request });

  const authClient = createServerClient(
    serverEnv.NEXT_PUBLIC_SUPABASE_URL,
    serverEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        for (const { name, value } of list) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
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
    return NextResponse.redirect(loginUrl);
  }

  if (!session.user.email_confirmed_at) {
    return NextResponse.redirect(new URL("/verificar", request.url));
  }

  const claims = decodeJwtPayload(session.access_token);
  const userRole = typeof claims?.["user_role"] === "string" ? (claims["user_role"] as string) : null;

  if (!userRole || !rule.roles.includes(userRole)) {
    return NextResponse.redirect(new URL("/403", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/mi-cuenta/:path*", "/ventas/:path*", "/tecnico/:path*", "/admin/:path*", "/api/v1/admin/:path*"],
};
