"use client";

import { useFormStatus } from "react-dom";

/**
 * Botón de envío con estado visible de "enviando" (useFormStatus lee el
 * <form> padre). Sin esto, un clic que no llega a registrarse (o una
 * subida que tarda) se ve idéntico a "no pasó nada" — exactamente el
 * síntoma reportado con la carga de logos de marca.
 */
export function SubmitButton({
  children,
  pendingLabel,
  className,
  disabled,
}: {
  children: React.ReactNode;
  pendingLabel: string;
  className?: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={disabled || pending} className={className}>
      {pending ? pendingLabel : children}
    </button>
  );
}
