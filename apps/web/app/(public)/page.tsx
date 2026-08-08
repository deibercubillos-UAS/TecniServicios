import Link from "next/link";
import {
  AudienceCard,
  Badge,
  CategoryChip,
  FeatureCard,
  Icon,
  StatItem,
  TrustItem,
  buttonClass,
} from "@tecni/ui";

const TRUST_ITEMS = [
  { icon: "shield", label: "Garantía oficial" } as const,
  { icon: "wrench", label: "Soporte técnico especializado" } as const,
  { icon: "truck", label: "Envío a nivel nacional" } as const,
  { icon: "headset", label: "Atención personalizada" } as const,
];

/**
 * TODO(2026-08-08): cifras placeholder — el usuario pidió dejarlas
 * visibles pero marcadas hasta confirmar los números reales
 * (docs/tasks/ACTIVE-fase-2-catalogo-publico-B.md, paso 6.3). No
 * publicar a producción sin reemplazarlas.
 */
const STATS = [
  { icon: "history", value: "—", label: "Años de experiencia" } as const,
  { icon: "building", value: "—", label: "Talleres atendidos" } as const,
  { icon: "box", value: "—", label: "Referencias en catálogo" } as const,
  { icon: "headset", value: "—", label: "Soporte técnico" } as const,
];

const FEATURES = [
  {
    icon: "medal",
    title: "Calidad certificada",
    description: "Marcas reconocidas que cumplen estándares de durabilidad para uso industrial.",
  },
  {
    icon: "bolt",
    title: "Entrega ágil",
    description: "Seguimiento de pedido y despacho pensado para minimizar el tiempo de inactividad del taller.",
  },
  {
    icon: "gear",
    title: "Asesoría especializada",
    description: "Te ayudamos a elegir el equipo correcto para tu operación, no solo a vender.",
  },
] as const;

const CATEGORIES = [
  { icon: "car", label: "Alineación", href: "/catalogo?categoria=alineacion" },
  { icon: "gear", label: "Balanceo", href: "/catalogo?categoria=balanceo" },
  { icon: "wrench", label: "Elevación", href: "/catalogo?categoria=elevacion" },
  { icon: "thermostat", label: "Diagnóstico", href: "/catalogo?categoria=diagnostico" },
  { icon: "drop", label: "Lubricación", href: "/catalogo?categoria=lubricacion" },
  { icon: "box", label: "Insumos", href: "/catalogo?categoria=insumos" },
] as const;

export default function HomePage() {
  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden bg-bg-inverse py-24 md:py-32">
        <div className="mx-auto flex max-w-[1280px] flex-col items-start px-4 md:px-6">
          <Badge>Equipamiento industrial para talleres</Badge>
          <h1 className="mt-8 max-w-3xl text-4xl font-extrabold tracking-tight text-text-inverse md:text-6xl">
            Soluciones que <span className="text-brand">construyen confianza</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-text-inverse-muted">
            Maquinaria, herramientas, repuestos y consumibles para el sector automotriz en
            Colombia — alineación, balanceo, elevación, diagnóstico y lubricación.
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Link href="/catalogo" className={buttonClass("primary")}>
              Ver catálogo completo
              <Icon name="arrowRight" size={20} />
            </Link>
            <Link href="/contacto" className={buttonClass("secondary")}>
              <Icon name="headset" size={20} />
              Solicitar asesoría
            </Link>
          </div>
        </div>
      </section>

      {/* Franja de confianza */}
      <section className="border-b border-border bg-surface">
        <div className="mx-auto grid max-w-[1280px] grid-cols-2 divide-x divide-y divide-border px-4 md:grid-cols-4 md:divide-y-0 md:px-6">
          {TRUST_ITEMS.map((item) => (
            <TrustItem key={item.label} icon={item.icon} label={item.label} />
          ))}
        </div>
      </section>

      {/* Estadísticas (placeholder, ver TODO arriba) */}
      <section className="bg-bg-inverse py-20">
        <div className="mx-auto max-w-[1280px] px-4 md:px-6">
          <div className="mb-12 text-center">
            <span className="mb-2 block text-sm uppercase tracking-widest text-text-inverse-muted">
              Resultados que nos respaldan
            </span>
            <div className="mx-auto h-1 w-12 bg-brand" />
          </div>
          <div className="grid grid-cols-2 gap-8 lg:grid-cols-4 lg:divide-x lg:divide-border-inverse">
            {STATS.map((stat) => (
              <StatItem key={stat.label} icon={stat.icon} value={stat.value} label={stat.label} />
            ))}
          </div>
        </div>
      </section>

      {/* Propuesta de valor */}
      <section className="bg-bg py-24">
        <div className="mx-auto max-w-[1280px] px-4 md:px-6">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <span className="mb-3 block text-sm uppercase tracking-widest text-brand">
              Nuestra propuesta de valor
            </span>
            <h2 className="mb-4 text-3xl font-bold text-text">Por qué elegir Tecni</h2>
            <p className="text-text-muted">
              No solo vendemos herramientas: te acompañamos para que tu operación sea segura y
              rentable.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {FEATURES.map((feature) => (
              <FeatureCard
                key={feature.title}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Selector de audiencia */}
      <section className="border-t border-border bg-surface py-24">
        <div className="mx-auto max-w-[1280px] px-4 md:px-6">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-text">Soluciones a medida</h2>
            <p className="text-text-muted">Elegí tu perfil para acceder a lo que necesitás.</p>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <AudienceCard
              eyebrow="Para profesionales"
              title="Comprador individual"
              items={[
                "Herramientas de mano y equipo profesional",
                "Seguimiento de tu pedido en tu cuenta",
                "Garantía por registro de producto",
              ]}
              ctaLabel="Crear cuenta"
            />
            <AudienceCard
              eyebrow="Para empresas B2B"
              title="Taller o empresa"
              items={[
                "Cotización asistida para compras grandes",
                "Seguimiento de pedidos por empresa",
                "Historial de equipos y mantenimiento",
              ]}
              ctaLabel="Solicitar cuenta corporativa"
              ctaVariant="primary"
            />
          </div>
        </div>
      </section>

      {/* Vista previa de categorías */}
      <section className="bg-bg-alt py-24">
        <div className="mx-auto max-w-[1280px] px-4 text-center md:px-6">
          <h2 className="mb-12 text-3xl font-bold text-text">Explora nuestro catálogo</h2>
          <div className="mb-16 flex flex-wrap justify-center gap-4">
            {CATEGORIES.map((category) => (
              <CategoryChip
                key={category.label}
                icon={category.icon}
                label={category.label}
                href={category.href}
              />
            ))}
          </div>
          <Link href="/catalogo" className={buttonClass("tertiary")}>
            Ver catálogo completo
            <Icon name="arrowRight" size={18} />
          </Link>
        </div>
      </section>
    </main>
  );
}
