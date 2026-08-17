import type { ReactNode } from "react";
import Image from "next/image";

export interface ProductCardPrice {
  visible: boolean;
  label?: string;
  unconfirmed?: boolean;
}

export interface ProductCardProps {
  name: string;
  brandName: string | null;
  imageUrl: string | null;
  imageAlt: string;
  price: ProductCardPrice;
  /** Ícono de favorito u otro overlay — el paquete no sabe de auth, quien
   * lo usa decide si lo pasa (nunca se renderiza para anónimos). */
  cornerAction?: ReactNode;
  /** Texto corto de disponibilidad real (ej. "En stock") — quien lo usa
   * decide cuándo mostrarlo según el dato real, nunca un valor fijo acá. */
  stockLabel?: string | undefined;
}

export function ProductCard({ name, brandName, imageUrl, imageAlt, price, cornerAction, stockLabel }: ProductCardProps) {
  return (
    <article className="flex flex-col overflow-hidden rounded-lg border border-border bg-surface transition-shadow hover:shadow-md">
      <div className="relative aspect-square w-full bg-bg-alt">
        {imageUrl ? (
          <Image src={imageUrl} alt={imageAlt} fill sizes="(max-width: 640px) 50vw, 25vw" className="object-cover" />
        ) : null}
        {cornerAction ? <div className="absolute right-2 top-2">{cornerAction}</div> : null}
        {stockLabel ? (
          <span className="absolute left-2 top-2 rounded-md border border-success/30 bg-success/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-success">
            {stockLabel}
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        {brandName ? (
          <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">
            {brandName}
          </span>
        ) : null}
        <h3 className="text-sm font-semibold text-text">{name}</h3>
        <div className="mt-auto pt-2 text-sm">
          {price.visible ? (
            <span className="font-semibold text-text">
              {price.label}
              {price.unconfirmed ? (
                <span className="ml-1 font-normal text-text-muted">(sujeto a confirmación)</span>
              ) : null}
            </span>
          ) : (
            <span className="font-medium text-brand">Inicia sesión para ver precios</span>
          )}
        </div>
      </div>
    </article>
  );
}
