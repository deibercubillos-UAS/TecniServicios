import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { adminClient, anonClient, createTestUser, deleteTestUser, signInAs } from "./helpers";

/**
 * Prueba real (HTTP real, no simulada) de que un anónimo nunca recibe
 * price_cop — la fuga más fácil de romper por accidente
 * (05-RLS-SECURITY.md sección 3). No prueba HTML de página todavía: no
 * existe ninguna página de catálogo real hasta la Fase 7 de
 * ACTIVE-fase-2-catalogo-publico.md. Prueba el contrato del que esas
 * páginas van a depender — public_products, la única fuente de datos de
 * catálogo que un anon puede tocar.
 */
describe("RLS: catálogo — el precio nunca llega a un anónimo", () => {
  const suffix = randomUUID().slice(0, 8);
  const emailCustomer = `rls-catalog-customer-${suffix}@tecni.test`;
  let categoryId = "";
  let productId = "";
  let customerId = "";

  beforeAll(async () => {
    customerId = await createTestUser(emailCustomer, "RLS Catalog Customer", "customer");

    const { data: category, error: categoryError } = await adminClient
      .from("categories")
      .insert({ slug: `cat-rls-catalog-${suffix}`, name: "Categoría RLS Catálogo", is_active: true })
      .select("id")
      .single();
    if (categoryError || !category) {
      throw new Error(`No se pudo crear la categoría de prueba: ${categoryError?.message}`);
    }
    categoryId = category["id"] as string;

    const { data: product, error: productError } = await adminClient
      .from("products")
      .insert({
        sku: `SKU-CATALOG-${suffix}`,
        slug: `prod-rls-catalog-${suffix}`,
        name: "Producto RLS Catálogo",
        category_id: categoryId,
        is_active: true,
        price_cop: 3500000,
      })
      .select("id")
      .single();
    if (productError || !product) {
      throw new Error(`No se pudo crear el producto de prueba: ${productError?.message}`);
    }
    productId = product["id"] as string;
  });

  afterAll(async () => {
    await adminClient.from("products").delete().eq("id", productId);
    await adminClient.from("categories").delete().eq("id", categoryId);
    await deleteTestUser(customerId);
  });

  it("anon: public_products no trae la columna price_cop", async () => {
    const client = anonClient();
    const { data, error } = await client.from("public_products").select("*").eq("id", productId).single();
    expect(error).toBeNull();
    expect(data).not.toBeNull();
    expect(Object.keys(data as object)).not.toContain("price_cop");
    expect(JSON.stringify(data)).not.toContain("3500000");
  });

  it("anon: no puede leer products directo (ni con select price_cop explícito)", async () => {
    const client = anonClient();
    const { data, error } = await client.from("products").select("id, price_cop").eq("id", productId);
    expect(error).toBeNull();
    expect(data ?? []).toEqual([]);
  });

  it("authenticated con sesión real: sí ve el precio en products", async () => {
    const client = await signInAs(emailCustomer);
    const { data, error } = await client.from("products").select("price_cop").eq("id", productId).single();
    expect(error).toBeNull();
    expect(data?.["price_cop"]).toBe(3500000);
  });
});
