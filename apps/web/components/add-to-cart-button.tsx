"use client";

import { useFormStatus } from "react-dom";
import { Icon } from "@tecni/ui";

/** `useFormStatus` solo funciona dentro de un hijo del `<form>` — por
 * eso es un componente aparte, no un botón inline en la página server. */
export function AddToCartButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="flex w-full items-center justify-center gap-2 rounded-[var(--radius)] bg-brand py-3 text-sm font-bold uppercase tracking-wide text-text-inverse transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? "Agregando..." : "Agregar al carrito"}
      {!pending ? <Icon name="arrowRight" size={18} /> : null}
    </button>
  );
}
