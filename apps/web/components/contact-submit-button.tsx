"use client";

import { useFormStatus } from "react-dom";
import { Icon } from "@tecni/ui";

export function ContactSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-2 flex items-center justify-center gap-2 rounded-[var(--radius)] bg-brand px-4 py-3 font-semibold text-text-inverse transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? "Enviando..." : "Enviar mensaje"}
      {!pending ? <Icon name="arrowRight" size={18} /> : null}
    </button>
  );
}
