"use client";

export function ConfirmSubmitButton({
  confirmMessage,
  className,
  children,
  title,
  "aria-label": ariaLabel,
}: {
  confirmMessage: string;
  className?: string;
  children: React.ReactNode;
  title?: string;
  "aria-label"?: string;
}) {
  return (
    <button
      type="submit"
      title={title}
      aria-label={ariaLabel}
      className={className}
      onClick={(e) => {
        if (!window.confirm(confirmMessage)) {
          e.preventDefault();
        }
      }}
    >
      {children}
    </button>
  );
}
