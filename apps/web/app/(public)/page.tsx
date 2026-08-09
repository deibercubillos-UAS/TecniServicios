import Link from "next/link";
import { cookies } from "next/headers";
import { createServerClient } from "@tecni/db";
import { formatCop, serverEnv } from "@tecni/shared";
import { resolvePrice } from "@tecni/core";
import { Badge, FeatureCard, Icon, ProductCard, StatItem, TrustItem, buttonClass, type IconName } from "@tecni/ui";

export const dynamic = "force-dynamic";

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

/** Icono decorativo por categoría real — sin `icon_url` cargado todavía
 * (columna existe, sin dato), se mapea por slug contra el set de íconos
 * disponible en `@tecni/ui`. Puramente visual, no es dato de negocio. */
const CATEGORY_ICON: Record<string, IconName> = {
  "alineacion-balanceo": "car",
  elevacion: "building",
  diagnostico: "thermostat",
  lubricacion: "drop",
  "insumos-consumibles": "box",
  "herramientas-taller": "wrench",
};

interface CategoryRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
}

interface FeaturedProductRow {
  id: string;
  slug: string;
  name: string;
  category_id: string;
  brand_id: string | null;
}

interface PriceRow {
  id: string;
  price_cop: number | null;
  price_synced_at: string | null;
}

interface BrandRow {
  id: string;
  name: string;
}

interface PromotionRow {
  id: string;
  name: string;
  description: string | null;
  discount_type: string;
  discount_value: number;
  product_id: string | null;
  category_id: string | null;
}

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(serverEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    getAll: () => cookieStore.getAll(),
    setAll: () => {},
  });
}

function formatDiscount(type: string, value: number): string {
  return type === "percentage" ? `${value}%` : formatCop(value);
}

export default async function HomePage() {
  const supabase = await getSupabase();

  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id ?? null;

  // `products` solo lo lee `authenticated` (RLS, Fase 2) — un visitante
  // anónimo necesita `public_products` (sin precio) para el conteo por
  // categoría y los destacados. El precio se resuelve aparte, solo si
  // hay sesión, mismo patrón que /catalogo.
  const [{ data: categoriesData }, { data: activeProductsData }, { data: featuredData }, { data: promoData }] = await Promise.all([
    supabase.from("categories").select("id,slug,name,description").eq("is_active", true).order("position"),
    supabase.from("public_products").select("category_id"),
    supabase.from("public_products").select("id,slug,name,category_id,brand_id").eq("is_featured", true).limit(6),
    supabase.from("promotions").select("id,name,description,discount_type,discount_value,product_id,category_id").limit(1).maybeSingle(),
  ]);

  const categories = (categoriesData as CategoryRow[] | null) ?? [];
  const productCountByCategory = new Map<string, number>();
  for (const row of (activeProductsData as { category_id: string }[] | null) ?? []) {
    productCountByCategory.set(row.category_id, (productCountByCategory.get(row.category_id) ?? 0) + 1);
  }

  const featuredProducts = (featuredData as FeaturedProductRow[] | null) ?? [];
  const brandIds = [...new Set(featuredProducts.map((p) => p.brand_id).filter((id): id is string => Boolean(id)))];
  const { data: brandsData } = brandIds.length > 0 ? await supabase.from("brands").select("id,name").in("id", brandIds) : { data: [] };
  const brands = (brandsData as BrandRow[] | null) ?? [];

  const productIds = featuredProducts.map((p) => p.id);
  const { data: priceRowsData } =
    userId && productIds.length > 0
      ? await supabase.from("products").select("id,price_cop,price_synced_at").in("id", productIds)
      : { data: [] };
  const priceByProduct = new Map(((priceRowsData as PriceRow[] | null) ?? []).map((row) => [row.id, row]));

  const { data: imagesData } =
    productIds.length > 0
      ? await supabase.from("product_images").select("product_id,url,alt").in("product_id", productIds).eq("is_primary", true)
      : { data: [] };
  const imageByProduct = new Map(((imagesData as { product_id: string; url: string; alt: string | null }[] | null) ?? []).map((img) => [img.product_id, img]));

  const promotion = promoData as PromotionRow | null;
  const featuredBanner = featuredProducts[0] ?? null;
  const featuredBannerBrand = featuredBanner?.brand_id ? brands.find((b) => b.id === featuredBanner.brand_id) : undefined;

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

      {/* 1. Category Grid — categorías reales con conteo real de productos activos */}
      {categories.length > 0 ? (
        <section className="bg-bg-alt py-24">
          <div className="mx-auto max-w-[1280px] px-4 md:px-6">
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-3xl font-bold text-text">Explora por categoría</h2>
              <p className="text-text-muted">Cada categoría con su inventario real, actualizado.</p>
            </div>
            <div className="grid grid-cols-2 gap-6 md:grid-cols-3">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/catalogo?categoria=${category.slug}`}
                  className="group flex flex-col items-start gap-3 rounded-lg border border-border bg-surface p-6 transition-all hover:border-brand hover:shadow-md"
                >
                  <span className="rounded-full bg-brand-subtle p-3">
                    <Icon name={CATEGORY_ICON[category.slug] ?? "box"} size={24} className="text-brand" />
                  </span>
                  <h3 className="font-semibold text-text">{category.name}</h3>
                  <span className="text-sm text-text-muted">{productCountByCategory.get(category.id) ?? 0} referencias</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* 2. Featured Brand Banner — un producto destacado real */}
      {featuredBanner ? (
        <section className="border-y border-border bg-surface py-24">
          <div className="mx-auto grid max-w-[1280px] grid-cols-1 items-center gap-12 px-4 md:grid-cols-2 md:px-6">
            <div>
              {featuredBannerBrand ? (
                <span className="mb-3 block text-sm font-semibold uppercase tracking-widest text-brand">{featuredBannerBrand.name}</span>
              ) : null}
              <h2 className="mb-4 text-3xl font-bold text-text">{featuredBanner.name}</h2>
              <p className="mb-8 text-text-muted">Producto destacado del catálogo — revisa la ficha técnica completa antes de decidir.</p>
              <Link href={`/catalogo/${featuredBanner.slug}`} className={buttonClass("primary")}>
                Ver producto
                <Icon name="arrowRight" size={18} />
              </Link>
            </div>
            <div className="aspect-square w-full overflow-hidden rounded-lg bg-bg-alt">
              {imageByProduct.get(featuredBanner.id) ? (
                <img
                  src={imageByProduct.get(featuredBanner.id)?.url}
                  alt={imageByProduct.get(featuredBanner.id)?.alt ?? featuredBanner.name}
                  className="h-full w-full object-cover"
                />
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      {/* 3. Productos destacados — is_featured real, nunca "más vendidos" fabricado */}
      {featuredProducts.length > 0 ? (
        <section className="bg-bg py-24">
          <div className="mx-auto max-w-[1280px] px-4 md:px-6">
            <div className="mb-12 flex items-end justify-between">
              <div>
                <h2 className="mb-2 text-3xl font-bold text-text">Productos destacados</h2>
                <p className="text-text-muted">Selección del equipo comercial, no un ranking de ventas.</p>
              </div>
              <Link href="/catalogo" className="hidden text-sm font-medium text-brand hover:underline sm:block">
                Ver todo el catálogo
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-6">
              {featuredProducts.map((product) => {
                const brand = product.brand_id ? brands.find((b) => b.id === product.brand_id) : undefined;
                const image = imageByProduct.get(product.id);
                const priceRow = priceByProduct.get(product.id);
                const resolution = resolvePrice({ priceCop: priceRow?.price_cop ?? null, priceSyncedAt: priceRow?.price_synced_at ?? null }, { userId });
                return (
                  <Link key={product.id} href={`/catalogo/${product.slug}`}>
                    <ProductCard
                      name={product.name}
                      brandName={brand?.name ?? null}
                      imageUrl={image?.url ?? null}
                      imageAlt={image?.alt ?? product.name}
                      price={
                        resolution.visible
                          ? { visible: true, label: formatCop(resolution.priceCop), unconfirmed: resolution.confidence === "unconfirmed" }
                          : { visible: false }
                      }
                    />
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}

      {/* 4. Promotional Banner — promoción activa real */}
      {promotion ? (
        <section className="w-full border-y-4 border-brand bg-bg-inverse py-16">
          <div className="mx-auto flex max-w-[1280px] flex-col items-center gap-4 px-4 text-center md:px-6">
            <Badge>Promoción activa</Badge>
            <h2 className="text-3xl font-bold text-text-inverse">{promotion.name}</h2>
            {promotion.description ? <p className="max-w-xl text-text-inverse-muted">{promotion.description}</p> : null}
            <p className="text-4xl font-extrabold text-brand">{formatDiscount(promotion.discount_type, promotion.discount_value)} de descuento</p>
            <Link href="/catalogo" className={buttonClass("primary")}>
              Ver en el catálogo
              <Icon name="arrowRight" size={18} />
            </Link>
          </div>
        </section>
      ) : null}

      {/* 5. How Quoting Works — el proceso real, no un mockup */}
      <section className="bg-bg py-24">
        <div className="mx-auto max-w-[1280px] px-4 text-center md:px-6">
          <div className="mb-16">
            <h2 className="mb-4 text-3xl font-bold text-text">Cómo funciona una cotización</h2>
            <p className="mx-auto max-w-xl text-text-muted">
              Para equipos por encima del umbral de compra directa, así se coordina la compra con un vendedor real.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="flex flex-col items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand text-lg font-bold text-text-inverse">1</span>
              <h3 className="font-semibold text-text">Solicitas la cotización</h3>
              <p className="text-sm text-text-muted">Desde la ficha del producto, con tu empresa ya registrada.</p>
            </div>
            <div className="flex flex-col items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand text-lg font-bold text-text-inverse">2</span>
              <h3 className="font-semibold text-text">Un vendedor te cotiza</h3>
              <p className="text-sm text-text-muted">La cotización se genera en nuestro sistema comercial y llega a tu cuenta.</p>
            </div>
            <div className="flex flex-col items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand text-lg font-bold text-text-inverse">3</span>
              <h3 className="font-semibold text-text">Aceptas y pagas</h3>
              <p className="text-sm text-text-muted">Desde tu cuenta, con seguimiento del pedido hasta la entrega.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Spec Search Teaser — atajo real al buscador/filtros del catálogo */}
      <section className="border-t border-border bg-surface py-20">
        <div className="mx-auto flex max-w-[1280px] flex-col items-center gap-6 px-4 text-center md:px-6">
          <h2 className="text-2xl font-bold text-text">¿Buscas una referencia específica?</h2>
          <p className="max-w-xl text-text-muted">Filtra el catálogo por categoría, marca y especificaciones técnicas.</p>
          <form action="/catalogo" method="get" className="w-full max-w-xl">
            <div className="relative w-full">
              <Icon name="search" size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                name="q"
                placeholder="Buscar equipos, herramientas, referencias..."
                className="w-full rounded-full border border-border bg-bg py-3 pl-12 pr-4 text-sm text-text placeholder:text-text-muted focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </div>
          </form>
          <Link href="/catalogo" className={buttonClass("tertiary")}>
            Ver catálogo completo
            <Icon name="arrowRight" size={18} />
          </Link>
        </div>
      </section>
    </main>
  );
}
