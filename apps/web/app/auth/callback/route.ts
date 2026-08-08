import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";

/**
 * Intercambia el `code` que Supabase Auth agrega al `redirectTo` (flujo
 * PKCE) por una sesión real, vía cookies en la respuesta. Necesario para
 * recuperación de contraseña (paso 8.4): `updateUser({ password })` exige
 * sesión activa, y el enlace del correo no la trae por sí solo. No estaba
 * en el árbol de rutas de 01-ARCHITECTURE.md — infraestructura técnica
 * necesaria para que el flujo nativo de Supabase Auth funcione, documentada
 * aquí y en la bitácora de la tarea.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/recuperar";
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/recuperar";

  if (!code) {
    return NextResponse.redirect(`${origin}/login`);
  }

  const response = NextResponse.redirect(`${origin}${safeNext}`);

  const authClient = createServerClient(
    serverEnv.NEXT_PUBLIC_SUPABASE_URL,
    serverEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        for (const { name, value, options } of list) {
          response.cookies.set(name, value, options);
        }
      },
    },
  );

  const { error } = await authClient.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent("El enlace expiró o ya se usó.")}`);
  }

  return response;
}
