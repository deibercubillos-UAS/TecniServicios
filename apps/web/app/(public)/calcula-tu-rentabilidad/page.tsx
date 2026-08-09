import type { Metadata } from "next";
import { cookies } from "next/headers";
import { createServerClient, createServiceRoleClient } from "@tecni/db";
import { serverEnv } from "@tecni/shared";

import { RoiCalculator, type EquipmentCategory, type EquipmentOption } from "@/components/roi-calculator";

export const metadata: Metadata = {
  title: "Calcula tu rentabilidad — Tecni Equipos y Servicios SAS",
  description: "Estima en cuántos meses se paga solo un equipo según cuántos servicios haces al mes.",
};

interface CategoryRow {
  id: string;
  name: string;
}

interface ProductRow {
  id: string;
  slug: string;
  name: string;
  category_id: string;
  price_cop: number | null;
  price_is_stale: boolean;
}

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(serverEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    getAll: () => cookieStore.getAll(),
    setAll: () => {},
  });
}

export default async function CalculaTuRentabilidadPage() {
  const supabase = await getSupabase();
  const { data: userData } = await supabase.auth.getUser();
  const isLoggedIn = Boolean(userData.user);

  const { data: categoriesData } = await supabase.from("categories").select("id,name").eq("is_active", true).order("position");
  const categories: EquipmentCategory[] = ((categoriesData as CategoryRow[] | null) ?? []).map((c) => ({ id: c.id, name: c.name }));

  // El precio es privado a anónimos (regla de negocio 5.1) — el selector de
  // equipo real con precio solo se arma con sesión, `products` ni siquiera
  // es legible por RLS para `anon`.
  let equipment: EquipmentOption[] = [];
  if (isLoggedIn) {
    const { data: productsData } = await supabase
      .from("products")
      .select("id,slug,name,category_id,price_cop,price_is_stale")
      .eq("is_active", true)
      .not("price_cop", "is", null)
      .order("name");
    const products = (productsData as ProductRow[] | null) ?? [];
    const productIds = products.map((p) => p.id);

    const { data: imagesData } =
      productIds.length > 0
        ? await supabase.from("product_images").select("product_id,url").in("product_id", productIds).eq("is_primary", true)
        : { data: [] };
    const imageByProduct = new Map(((imagesData as { product_id: string; url: string }[] | null) ?? []).map((i) => [i.product_id, i.url]));

    equipment = products.map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      categoryId: p.category_id,
      priceCop: p.price_cop as number,
      priceIsStale: p.price_is_stale,
      imageUrl: imageByProduct.get(p.id) ?? null,
    }));
  }

  // Mismo umbral real que el carrito (docs/13-MODULE-COMMERCE.md, regla de
  // negocio 5.2) — vía service role, igual que /carrito lo lee hoy.
  const serviceClient = createServiceRoleClient(serverEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv.SUPABASE_SERVICE_ROLE_KEY);
  const { data: thresholdSetting } = await serviceClient.from("settings").select("value").eq("key", "quote_threshold_cop").maybeSingle();
  const quoteThresholdCop = typeof thresholdSetting?.value === "number" ? thresholdSetting.value : 5_000_000;

  return (
    <div className="mx-auto flex max-w-[900px] flex-col gap-6 px-4 py-16">
      <div>
        <h1 className="text-2xl font-bold text-text">Calcula tu rentabilidad</h1>
        <p className="text-sm text-text-muted">
          Estima en cuántos meses un equipo se paga solo, según cuántos servicios haces al mes y cuánto ganas por cada uno.
        </p>
      </div>
      <RoiCalculator categories={categories} equipment={equipment} isLoggedIn={isLoggedIn} quoteThresholdCop={quoteThresholdCop} />
    </div>
  );
}
