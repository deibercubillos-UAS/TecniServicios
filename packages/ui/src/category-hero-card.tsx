export interface CategoryHeroCardProps {
  href: string;
  imageUrl: string;
  name: string;
  meta?: string;
}

/** Card de categoría con foto full-bleed y overlay degradado — benchmark
 * es.hunter.com, docs/02-DESIGN-SYSTEM.md sección 4 / docs/03-UI-
 * COMPONENTS.md sección 3. Requiere una foto real (`categories.image_url`);
 * sin ella se usa la card de ícono existente, nunca una foto de stock. */
export function CategoryHeroCard({ href, imageUrl, name, meta }: CategoryHeroCardProps) {
  return (
    <a
      href={href}
      className="group relative flex aspect-[4/3] flex-col justify-end overflow-hidden rounded-[var(--radius)] bg-bg-inverse"
    >
      <img
        src={imageUrl}
        alt=""
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ background: "linear-gradient(to top, var(--bg-inverse) 0%, rgba(17,17,17,0.15) 55%, transparent 75%)" }}
      />
      <div className="relative flex flex-col gap-1 p-5">
        <h3 className="text-lg font-bold uppercase leading-tight text-text-inverse">{name}</h3>
        {meta ? <span className="text-sm text-text-inverse-muted">{meta}</span> : null}
      </div>
    </a>
  );
}
