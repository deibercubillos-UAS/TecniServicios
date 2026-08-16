import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { createServerClient } from "@tecni/db";
import { formatCop, serverEnv } from "@tecni/shared";
import { resolvePrice } from "@tecni/core";
import { Badge, Icon, ProductCard, buttonClass } from "@tecni/ui";
import { HeroCarousel, type HeroSlide } from "../../components/hero-carousel";
import { CategoryCarousel } from "../../components/category-carousel";
import { FavoriteButton } from "../../components/favorite-button";
import { CATEGORY_ICON } from "../../lib/category-icons";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

/** Módulos reales de la plataforma — nunca "servicios" inventados. Cada
 * uno apunta a una ruta que existe (docs/13-MODULE-COMMERCE.md,
 * docs/14-MODULE-SERVICE.md). */
const SERVICES = [
  {
    icon: "box",
    title: "Catálogo con precios reservados",
    description: "Equipos, repuestos e insumos para el sector automotriz. El precio se resuelve al iniciar sesión.",
    href: "/catalogo",
    cta: "Ver catálogo",
  },
  {
    icon: "handshake",
    title: "Cotización asistida",
    description: "Para equipos de alto valor, un vendedor te cotiza directo en Siigo y la ves en tu cuenta.",
    href: "/contacto",
    cta: "Hablar con un vendedor",
  },
  {
    icon: "wrench",
    title: "Mantenimiento y postventa",
    description: "Cada equipo que compras genera manual, agenda de mantenimiento e historial de servicio.",
    href: "/mi-cuenta/mantenimientos",
    cta: "Ver mantenimientos",
  },
  {
    icon: "headset",
    title: "Soporte técnico",
    description: "Tickets de soporte para tu equipo, con seguimiento desde tu cuenta.",
    href: "/mi-cuenta/tickets",
    cta: "Ver soporte",
  },
] as const;

interface CategoryRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  image_url: string | null;
}

interface CatalogProductRow {
  id: string;
  slug: string;
  name: string;
  category_id: string;
  brand_id: string | null;
  stock_status: string;
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

interface BannerRow {
  id: string;
  title: string | null;
  image_url: string;
  mobile_image_url: string | null;
  link_url: string | null;
}

interface TestimonialRow {
  id: string;
  author_name: string;
  company: string | null;
  role: string | null;
  quote: string;
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
  // anónimo necesita `public_products` (sin precio) para conteos,
  // destacados y bestsellers. El precio se resuelve aparte, solo si
  // hay sesión, mismo patrón que /catalogo.
  const [
    { data: heroBannersData },
    { data: promoBannerData },
    { data: categoriesData },
    { data: activeProductsData },
    { data: bestsellersData },
    { data: promoData },
    { data: allBrandsData },
    { data: testimonialsData },
  ] = await Promise.all([
      supabase.from("banners").select("id,title,image_url,mobile_image_url,link_url").eq("placement", "home_hero").eq("is_active", true).order("position"),
      supabase.from("banners").select("image_url").eq("placement", "promotions").eq("is_active", true).order("position").limit(1).maybeSingle(),
      supabase.from("categories").select("id,slug,name,description,image_url").eq("is_active", true).order("position"),
      supabase.from("public_products").select("category_id"),
      // Selección manual del master (id,name,category_id,brand_id no vienen de order_items:
      // order_items es RLS de empresa, no público — ver decisión del usuario en
      // docs/tasks — "lo más vendido" es curaduría real, no un ranking automático).
      supabase.from("public_products").select("id,slug,name,category_id,brand_id,stock_status").eq("is_bestseller", true).limit(8),
      supabase.from("promotions").select("id,name,description,discount_type,discount_value,product_id,category_id").limit(1).maybeSingle(),
      supabase.from("brands").select("name,logo_url").eq("is_active", true).order("name"),
      supabase.from("testimonials").select("id,author_name,company,role,quote").eq("is_active", true).order("position"),
    ]);
  const brandStrip = (allBrandsData as { name: string; logo_url: string | null }[] | null) ?? [];
  const promoBannerUrl = (promoBannerData as { image_url: string } | null)?.image_url ?? null;
  const testimonials = (testimonialsData as TestimonialRow[] | null) ?? [];

  const heroSlides: HeroSlide[] = ((heroBannersData as BannerRow[] | null) ?? []).map((b) => ({
    id: b.id,
    title: b.title,
    imageUrl: b.image_url,
    mobileImageUrl: b.mobile_image_url,
    linkUrl: b.link_url,
  }));

  const categories = (categoriesData as CategoryRow[] | null) ?? [];
  const productCountByCategory = new Map<string, number>();
  for (const row of (activeProductsData as { category_id: string }[] | null) ?? []) {
    productCountByCategory.set(row.category_id, (productCountByCategory.get(row.category_id) ?? 0) + 1);
  }

  const bestsellers = (bestsellersData as CatalogProductRow[] | null) ?? [];
  const brandIds = [...new Set(bestsellers.map((p) => p.brand_id).filter((id): id is string => Boolean(id)))];
  const { data: brandsData } = brandIds.length > 0 ? await supabase.from("brands").select("id,name").in("id", brandIds) : { data: [] };
  const brands = (brandsData as BrandRow[] | null) ?? [];

  const productIds = bestsellers.map((p) => p.id);
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

  const { data: favoritesData } =
    userId && productIds.length > 0
      ? await supabase.from("favorites").select("product_id").eq("profile_id", userId).in("product_id", productIds)
      : { data: [] };
  const favoritedIds = new Set(((favoritesData as { product_id: string }[] | null) ?? []).map((f) => f.product_id));

  const promotion = promoData as PromotionRow | null;

  const siteUrl = serverEnv.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Tecni Equipos y Servicios SAS",
    description: "Maquinaria, herramientas, repuestos y consumibles para el sector automotriz en Colombia.",
    slogan: "Soluciones que construyen confianza",
    url: siteUrl,
    logo: `${siteUrl}/brand/logo-mark.png`,
    areaServed: "CO",
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }} />

      {/* Hero — panel de texto fijo + carrusel de banners reales (placement
          home_hero) a la derecha cuando existen, nunca una foto de stock
          inventada en su lugar (benchmark es.hunter.com, ver
          docs/02-DESIGN-SYSTEM.md sección 4). */}
      <HeroCarousel slides={heroSlides} />

      {/* Franja de marcas — prueba social real: marcas activas de `brands`.
          Logo real si se subió desde /admin/marcas; si no, el nombre como
          respaldo — nunca un logo inventado. */}
      {brandStrip.length > 0 ? (
        <section className="border-b border-border bg-surface py-8">
          <div className="mx-auto max-w-[1280px] px-4 md:px-6">
            <p className="mb-4 text-center text-xs font-semibold uppercase tracking-widest text-text-muted">
              Distribuidor autorizado de
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
              {brandStrip.map((brand) =>
                brand.logo_url ? (
                  <img
                    key={brand.name}
                    src={brand.logo_url}
                    alt={brand.name}
                    className="h-8 w-auto max-w-[140px] object-contain grayscale transition-all hover:grayscale-0 md:h-10"
                  />
                ) : (
                  <span key={brand.name} className="text-lg font-bold tracking-tight text-text-muted">
                    {brand.name}
                  </span>
                ),
              )}
            </div>
          </div>
        </section>
      ) : null}

      {/* 1. Servicios ofrecidos — los 4 módulos reales de la plataforma */}
      <section className="bg-bg py-24">
        <div className="mx-auto max-w-[1280px] px-4 md:px-6">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <span className="mb-3 block text-sm uppercase tracking-widest text-brand">Cómo trabajamos contigo</span>
            <h2 className="mb-4 text-3xl font-bold text-text">Servicios ofrecidos</h2>
            <p className="text-text-muted">De la compra a la postventa, en un solo lugar.</p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {SERVICES.map((service) => (
              <div key={service.title} className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-6">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-subtle">
                  <Icon name={service.icon} size={24} className="text-brand" />
                </span>
                <h3 className="font-semibold text-text">{service.title}</h3>
                <p className="flex-1 text-sm text-text-muted">{service.description}</p>
                <Link href={service.href} className="text-sm font-medium text-brand hover:underline">
                  {service.cta} →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 2. Explorar por categorías — categorías reales con conteo real de productos activos */}
      {categories.length > 0 ? (
        <section className="bg-bg-alt py-24">
          <div className="mx-auto max-w-[1280px] px-4 md:px-6">
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-3xl font-bold text-text">Explora por categoría</h2>
              <p className="text-text-muted">Cada categoría con su inventario real, actualizado.</p>
              <Link href="/catalogo/categorias" className="mt-3 inline-block text-sm font-medium text-brand hover:underline">
                Ver todas las categorías →
              </Link>
            </div>
            <CategoryCarousel
              items={categories.map((category) => ({
                id: category.id,
                slug: category.slug,
                name: category.name,
                imageUrl: category.image_url,
                meta: `${productCountByCategory.get(category.id) ?? 0} referencias`,
                icon: CATEGORY_ICON[category.slug] ?? "box",
              }))}
            />
          </div>
        </section>
      ) : null}

      {/* 3. Lo más vendido — selección manual real del master (is_bestseller),
          nunca un ranking automático fabricado de ventas: order_items es RLS
          de empresa, no dato público agregable con la infraestructura actual. */}
      {bestsellers.length > 0 ? (
        <section className="border-y-4 border-brand bg-bg py-24">
          <div className="mx-auto max-w-[1280px] px-4 md:px-6">
            <div className="mb-12 flex items-end justify-between">
              <div>
                <span className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-brand">
                  <Icon name="star" size={16} />
                  Curado por el equipo comercial
                </span>
                <h2 className="text-4xl font-bold text-text">Lo más vendido</h2>
              </div>
              <Link href="/catalogo" className="hidden text-sm font-medium text-brand hover:underline sm:block">
                Ver todo el catálogo
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
              {bestsellers.map((product) => {
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
                      cornerAction={
                        userId ? (
                          <FavoriteButton productId={product.id} initialFavorited={favoritedIds.has(product.id)} />
                        ) : undefined
                      }
                      stockLabel={product.stock_status === "in_stock" ? "En stock" : undefined}
                    />
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}

      {/* 4. Promoción activa real — banner opcional (placement `promotions`)
          detrás del texto, subido desde /admin/banners. */}
      {promotion ? (
        <section
          className="relative w-full overflow-hidden border-y-4 border-brand bg-bg-inverse py-16"
          style={promoBannerUrl ? { backgroundImage: `url(${promoBannerUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
        >
          {promoBannerUrl ? <div className="absolute inset-0 bg-bg-inverse/80" aria-hidden="true" /> : null}
          <div className="relative mx-auto flex max-w-[1280px] flex-col items-center gap-4 px-4 text-center md:px-6">
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

      {/* 5. Calcula tu rentabilidad — teaser real hacia la calculadora existente */}
      <section className="border-y border-border bg-surface py-20">
        <div className="mx-auto grid max-w-[1280px] grid-cols-1 items-center gap-10 px-4 md:grid-cols-2 md:px-6">
          <div>
            <span className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-brand">
              <Icon name="calculator" size={18} />
              Herramienta gratuita
            </span>
            <h2 className="mb-4 text-3xl font-bold text-text">Calcula tu rentabilidad</h2>
            <p className="mb-8 max-w-lg text-text-muted">
              Estima en cuántos meses recuperas la inversión de un equipo según los servicios que factura tu taller cada mes.
            </p>
            <Link href="/calcula-tu-rentabilidad" className={buttonClass("primary")}>
              Abrir calculadora
              <Icon name="arrowRight" size={18} />
            </Link>
          </div>
          <div className="rounded-lg border border-border bg-bg p-8">
            <dl className="flex flex-col gap-4 text-sm">
              <div className="flex justify-between border-b border-border pb-3">
                <dt className="text-text-muted">Precio del equipo</dt>
                <dd className="font-semibold text-text">Lo defines tú</dd>
              </div>
              <div className="flex justify-between border-b border-border pb-3">
                <dt className="text-text-muted">Servicios por mes</dt>
                <dd className="font-semibold text-text">Lo defines tú</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-text-muted">Meses para recuperar la inversión</dt>
                <dd className="text-lg font-bold text-brand">Resultado inmediato</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      {/* 6. Cómo funciona una cotización — el proceso real, no un mockup */}
      <section className="bg-bg py-16">
        <div className="mx-auto max-w-[1280px] px-4 text-center md:px-6">
          <div className="mb-12">
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

      {/* 7. Testimonios reales — solo si el master cargó al menos uno
          activo desde /admin/testimonios, nunca un texto de relleno. */}
      {testimonials.length > 0 ? (
        <section className="bg-bg-alt py-24">
          <div className="mx-auto max-w-[1280px] px-4 md:px-6">
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <span className="mb-3 block text-sm uppercase tracking-widest text-brand">Clientes reales</span>
              <h2 className="text-3xl font-bold text-text">Lo que dicen nuestros clientes</h2>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {testimonials.map((testimonial) => (
                <figure key={testimonial.id} className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-6">
                  <Icon name="chat" size={24} className="text-brand" />
                  <blockquote className="flex-1 text-text">“{testimonial.quote}”</blockquote>
                  <figcaption className="text-sm">
                    <p className="font-semibold text-text">{testimonial.author_name}</p>
                    {testimonial.role || testimonial.company ? (
                      <p className="text-text-muted">
                        {testimonial.role}
                        {testimonial.role && testimonial.company ? " · " : ""}
                        {testimonial.company}
                      </p>
                    ) : null}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      ) : null}

    </main>
  );
}
