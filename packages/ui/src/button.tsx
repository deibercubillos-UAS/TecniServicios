import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "tertiary";

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary:
    "bg-brand text-text-inverse hover:bg-brand-hover shadow-sm",
  secondary:
    "bg-transparent text-text-inverse border-2 border-text-inverse hover:bg-text-inverse hover:text-bg-inverse",
  tertiary:
    "bg-transparent text-text border-2 border-text hover:bg-text hover:text-text-inverse",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: ReactNode;
}

export function Button({ variant = "primary", className = "", children, ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 font-semibold transition-colors ${VARIANT_CLASS[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
