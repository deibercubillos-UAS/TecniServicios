"use client";

import { useEffect } from "react";

import { reportError } from "@/lib/error-tracking";

/**
 * Boundary de error de Next.js App Router — captura errores de render que
 * escapan a cualquier `error.tsx` local. Única excepción de este proyecto
 * a "Server Components por defecto" (CLAUDE.md sección 7): Next.js exige
 * que `global-error.tsx` sea `"use client"`, reemplaza el layout raíz
 * cuando se activa, así que define su propio `<html>/<body>`.
 */
export default function GlobalError({ error }: { error: Error & { digest?: string }; reset: () => void }): React.ReactElement {
  useEffect(() => {
    reportError(error, { digest: error.digest });
  }, [error]);

  return (
    <html lang="es">
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bg px-4 text-center font-sans text-text">
        <h1 className="text-2xl font-bold">Algo salió mal</h1>
        <p className="max-w-[440px] text-sm text-text-muted">
          Ocurrió un error inesperado. Ya quedó registrado — intenta recargar la página.
        </p>
      </body>
    </html>
  );
}
