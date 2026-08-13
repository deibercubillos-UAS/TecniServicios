"use client";

import { useState } from "react";

/**
 * Next.js corta la petición cuando el body supera `serverActions.bodySizeLimit`
 * (next.config.ts) ANTES de que el server action se ejecute — el try/catch de
 * la action nunca lo ve, así que el usuario cae en la pantalla genérica de
 * error en vez de un mensaje útil. Fotos reales de celular pesan varios MB,
 * más que el límite. Este wrapper valida el tamaño en el navegador antes de
 * enviar, para nunca llegar a esa situación.
 */
export function FileSizeGuardForm({
  action,
  maxMB,
  className,
  children,
}: {
  action: (formData: FormData) => void;
  maxMB: number;
  className?: string;
  children: React.ReactNode;
}) {
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      action={action}
      className={className}
      onSubmit={(e) => {
        const form = e.currentTarget;
        const files: File[] = [];
        for (const el of Array.from(form.elements)) {
          if (el instanceof HTMLInputElement && el.type === "file" && el.files) {
            files.push(...Array.from(el.files));
          }
        }
        const totalMB = files.reduce((sum, f) => sum + f.size, 0) / (1024 * 1024);
        if (totalMB > maxMB) {
          e.preventDefault();
          setError(`El archivo pesa ${totalMB.toFixed(1)} MB — el máximo permitido es ${maxMB} MB. Comprime la foto o usa una más liviana.`);
        } else {
          setError(null);
        }
      }}
    >
      {children}
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
    </form>
  );
}
