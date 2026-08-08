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
}

export function ProductCard({ name, brandName, imageUrl, imageAlt, price }: ProductCardProps) {
  return (
    <article className="flex flex-col overflow-hidden rounded-lg border border-border bg-surface transition-shadow hover:shadow-md">
      <div className="aspect-square w-full bg-bg-alt">
        {imageUrl ? (
          <img src={imageUrl} alt={imageAlt} className="h-full w-full object-cover" loading="lazy" />
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
