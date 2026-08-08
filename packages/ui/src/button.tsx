import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "tertiary";

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary:
    "bg-brand text-text-inverse hover:bg-brand-hover shadow-sm",
  secondary:
    "bg-transparent text-text-inverse border-2 border-text-inverse hover:bg-text-inverse hover:text-bg-inverse",
  tertiary:
    "bg-transparent text-text border-2 border-text hover:bg-text hover:text-text-inverse",
};

const BASE_CLASS =
  "inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 font-semibold transition-colors";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: ReactNode;
}

export function Button({ variant = "primary", className = "", children, ...props }: ButtonProps) {
  return (
    <button className={`${BASE_CLASS} ${VARIANT_CLASS[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

export interface LinkButtonProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: ButtonVariant;
  children: ReactNode;
}

export function LinkButton({ variant = "primary", className = "", children, ...props }: LinkButtonProps) {
  return (
    <a className={`${BASE_CLASS} ${VARIANT_CLASS[variant]} ${className}`} {...props}>
      {children}
    </a>
  );
}

/** Clases del Button para usarlas en un `next/link` `<Link>` (navegación cliente). */
export function buttonClass(variant: ButtonVariant = "primary", className = "") {
  return `${BASE_CLASS} ${VARIANT_CLASS[variant]} ${className}`;
}
