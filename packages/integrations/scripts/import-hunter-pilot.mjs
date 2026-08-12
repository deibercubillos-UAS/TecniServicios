// Script de una sola vez — Fase "piloto Hunter" (docs/tasks/ACTIVE-import-hunter-pilot.md).
// Crea la marca Hunter Engineering y 12 productos borrador (is_active=false)
// con foto real (subdealer, subida a R2) y las specs que sí aparecen como
// dato concreto en cada página pública — nunca datos inventados.
// Uso: node packages/integrations/scripts/import-hunter-pilot.mjs
import { createClient } from "@supabase/supabase-js";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { readFileSync } from "node:fs";

function loadEnvLocal(path) {
  const text = readFileSync(path, "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvLocal(new URL("../../../apps/web/.env.local", import.meta.url).pathname);

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const R2 = {
  accountId: process.env.R2_ACCOUNT_ID,
  accessKeyId: process.env.R2_ACCESS_KEY_ID,
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  bucketName: process.env.R2_BUCKET_NAME,
  publicUrl: process.env.R2_PUBLIC_URL,
};
for (const [k, v] of Object.entries({ SUPABASE_URL, SERVICE_ROLE_KEY, ...R2 })) {
  if (!v) throw new Error(`Falta variable de entorno: ${k}`);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${R2.accountId}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: R2.accessKeyId, secretAccessKey: R2.secretAccessKey },
});

const IMG_DIR = "/private/tmp/claude-501/-Users-deiber-TecniServicios/1326b10d-79e0-4f80-80a5-ce4d8c418574/scratchpad/hunter-images";

const CATEGORY = {
  alineacionBalanceo: "40327a74-6d69-4106-b4ef-c5cdbf417a8d",
  elevacion: "34b02efa-04f0-4e46-94c9-4a51b8ff1af7",
};

const ATTR = {
  ab_voltaje: "07b626eb-8653-433d-9c00-4f8ee82d026f",
  ab_capacidadCarga: "d8219e0e-cc1d-4df5-b633-e4110c6d9644",
  ab_diametroRueda: "65cf0670-6a03-4ef5-b50c-5c66b06f8777",
  ab_precisionMedicion: "03a68dc2-5338-432d-a898-d890c778d249",
  el_capacidadCarga: "06afa5b1-1ebd-458e-ac69-5251bf36a3d9",
};

const PRODUCTS = [
  {
    sku: "HUNTER-HAWKEYE-ELITE",
    slug: "hunter-hawkeye-elite",
    name: "Hunter HawkEye Elite®",
    shortDescription: "Sistema de alineación de ruedas con medición por cámara de alta resolución y adaptadores QuickGrip® sin contacto metal-metal.",
    description:
      "Máquina de alineación de ruedas de Hunter Engineering con captura de mediciones en 70 segundos y precisión milimétrica, mediante cuatro cámaras de alta resolución y el software WinAlign®. Incluye adaptadores QuickGrip® de sujeción sin contacto metal-metal y posicionamiento simplificado de accesorios de calibración estática ADAS.",
    categoryId: CATEGORY.alineacionBalanceo,
    warrantyMonths: 36,
    isSerialized: true,
    image: "hawkeye-elite.jpg",
    sourceUrl: "https://es.hunter.com/es-int/maquinas-de-alineacion/hawkeye-elite/",
    attrs: [{ id: ATTR.ab_precisionMedicion, dataType: "text", value: "Medición de alineación en 70 segundos, precisión milimétrica" }],
  },
  {
    sku: "HUNTER-HAWKEYE-XL",
    slug: "hunter-hawkeye-xl",
    name: "Hunter HawkEye® XL",
    shortDescription: "Máquina de alineación de gran capacidad para camiones, autobuses de servicio pesado y flotas de servicio medio.",
    description:
      "Sistema de alineación de Hunter Engineering diseñado para camiones semirremolque, autobuses de servicio pesado, vehículos utilitarios y flotas de servicio medio, con tecnología de cámara patentada de Hunter para mediciones rápidas y de gran capacidad.",
    categoryId: CATEGORY.alineacionBalanceo,
    warrantyMonths: 36,
    isSerialized: true,
    image: "hawkeye-xl.jpg",
    sourceUrl: "https://es.hunter.com/es-int/maquinas-de-alineacion/hawkeye-xl/",
    attrs: [],
  },
  {
    sku: "HUNTER-ALINEACION-ESTANDAR",
    slug: "hunter-alineacion-estandar",
    name: "Hunter Máquinas de alineación estándar",
    shortDescription: "Sistema de alineación de bajo costo de propiedad, con lectura rápida mediante tecnología HawkEye® y software WinAlign® Lite.",
    description:
      "Línea de máquinas de alineación estándar de Hunter Engineering, orientada a resultados rápidos con un tiempo de configuración veloz (aprox. 2 minutos), adaptadores de rueda fáciles de instalar y cobertura completa del vehículo mediante WinAlign® Lite.",
    categoryId: CATEGORY.alineacionBalanceo,
    warrantyMonths: 36,
    isSerialized: true,
    image: "align-standard.jpg",
    sourceUrl: "https://es.hunter.com/es-int/maquinas-de-alineacion/estandar/",
    attrs: [
      { id: ATTR.ab_diametroRueda, dataType: "text", value: "hasta 622 mm" },
      { id: ATTR.ab_precisionMedicion, dataType: "text", value: "Tiempo de configuración de 2 minutos" },
    ],
  },
  {
    sku: "HUNTER-REVOLUTION",
    slug: "hunter-revolution",
    name: "Hunter Revolution™",
    shortDescription: "Cambiadora de neumáticos totalmente automática, con modo WalkAway™ semiautónomo que protege rines y neumáticos.",
    description:
      "Cambiadora de neumáticos de Hunter Engineering con capacidad totalmente automática. El modo WalkAway™ semiautónomo reduce el tiempo de servicio en un juego de 4 neumáticos y las herramientas de polímero evitan el contacto metal-metal con el rin.",
    categoryId: CATEGORY.alineacionBalanceo,
    warrantyMonths: 36,
    isSerialized: true,
    image: "revolution.jpg",
    sourceUrl: "https://es.hunter.com/es-int/cambiadoras-de-neumaticos/revolution/",
    attrs: [{ id: ATTR.ab_diametroRueda, dataType: "text", value: "304.8–762 mm de rin, hasta 1270 mm de neumático" }],
  },
  {
    sku: "HUNTER-MAVERICK",
    slug: "hunter-maverick",
    name: "Hunter Maverick®",
    shortDescription: "Cambiadora de neumáticos con control hidráulico totalmente variable, enfocada en la operación asistida por el técnico.",
    description:
      "Cambiadora de neumáticos de Hunter Engineering diseñada y construida en EE. UU., que combina la comodidad del movimiento hidráulico con la velocidad de la operación manual, pensada para el control total del técnico.",
    categoryId: CATEGORY.alineacionBalanceo,
    warrantyMonths: 36,
    isSerialized: true,
    image: "maverick.jpg",
    sourceUrl: "https://es.hunter.com/es-int/cambiadoras-de-neumaticos/maverick/",
    attrs: [{ id: ATTR.ab_diametroRueda, dataType: "text", value: "254–863.6 mm de rin, hasta 1270 mm de neumático" }],
  },
  {
    sku: "HUNTER-TCX-SUJECION-CENTRAL",
    slug: "hunter-cambiadora-sujecion-central",
    name: "Hunter Cambiadora de neumáticos de sujeción central",
    shortDescription: "Cambiadora de neumáticos de sujeción central, con funcionamiento sencillo y protección superior de las ruedas.",
    description:
      "Línea de cambiadoras de neumáticos de sujeción central de Hunter Engineering (familia TCX), con hasta 1175 Nm de par de torsión y velocidad variable en determinados modelos, orientada a proteger rines de alto valor.",
    categoryId: CATEGORY.alineacionBalanceo,
    warrantyMonths: 36,
    isSerialized: true,
    image: "centerclamp.jpg",
    sourceUrl: "https://es.hunter.com/es-int/cambiadoras-de-neumaticos/sujecion-central/",
    attrs: [{ id: ATTR.ab_diametroRueda, dataType: "text", value: "hasta 762 mm de rin" }],
  },
  {
    sku: "HUNTER-ROAD-FORCE-WALKAWAY",
    slug: "hunter-road-force-walkaway",
    name: "Hunter Road Force® WalkAway™",
    shortDescription: "Balanceadora de ruedas de diagnóstico con rodillo de carga que detecta problemas de vibración.",
    description:
      "Balanceadora de ruedas de diagnóstico de Hunter Engineering, con rodillo de carga que simula la condición de manejo real para detectar y resolver problemas de vibración, más allá del balanceo estático o dinámico simple.",
    categoryId: CATEGORY.alineacionBalanceo,
    warrantyMonths: 36,
    isSerialized: true,
    image: "road-force.jpg",
    sourceUrl: "https://es.hunter.com/es-int/balanceadoras-ruedas/road-force/",
    attrs: [
      { id: ATTR.ab_diametroRueda, dataType: "text", value: "254–762 mm de rin" },
      { id: ATTR.ab_precisionMedicion, dataType: "text", value: "Solución de desbalanceos ± 0.01 oz, velocidad de balanceo 300 rpm" },
    ],
  },
  {
    sku: "HUNTER-SMARTWEIGHT-ELITE",
    slug: "hunter-smartweight-elite",
    name: "Hunter SmartWeight® Elite",
    shortDescription: "Balanceadora de ruedas con sistema de visión, entrada automática de dimensiones y CenteringCheck® automático.",
    description:
      "Balanceadora de ruedas de Hunter Engineering con sistema de visión patentado y tecnología SmartWeight®, que entrega entrada automática de dimensiones, verificación automática de centrado y diagnóstico de alabeo del rin.",
    categoryId: CATEGORY.alineacionBalanceo,
    warrantyMonths: 36,
    isSerialized: true,
    image: "smartweight-elite.jpg",
    sourceUrl: "https://es.hunter.com/es-int/balanceadoras-ruedas/smartweight-elite/",
    attrs: [
      { id: ATTR.ab_diametroRueda, dataType: "text", value: "254–762 mm de rin" },
      { id: ATTR.ab_precisionMedicion, dataType: "text", value: "Solución de desbalanceos ± 0.01 oz, velocidad de balanceo 300 rpm" },
    ],
  },
  {
    sku: "HUNTER-HD-ELITE",
    slug: "hunter-hd-elite",
    name: "Hunter HD Elite™",
    shortDescription: "Balanceadora de ruedas de servicio pesado para camiones y autobuses, con sistema de visión patentado.",
    description:
      "Balanceadora de ruedas de servicio pesado de Hunter Engineering para ruedas de autobuses y camiones, basada en las características de Road Force® Elite, con sistema de visión patentado y capacidades de diagnóstico de vibración.",
    categoryId: CATEGORY.alineacionBalanceo,
    warrantyMonths: 36,
    isSerialized: true,
    image: "hd-elite.jpg",
    sourceUrl: "https://es.hunter.com/es-int/balanceadoras-ruedas/hd-elite/",
    attrs: [
      { id: ATTR.ab_diametroRueda, dataType: "text", value: "254–762 mm de rin" },
      { id: ATTR.ab_precisionMedicion, dataType: "text", value: "Solución de desbalanceos ± 0.05 oz, velocidad de balanceo 100 rpm" },
    ],
  },
  {
    sku: "HUNTER-LIFTRACK-TIJERA",
    slug: "hunter-elevadores-tijera",
    name: "Hunter Elevadores de alineación tipo tijera",
    shortDescription: "Familia de elevadores tipo tijera para automóviles, con varias capacidades y distancias entre ejes, ideal para espacios reducidos.",
    description:
      "Rampas de alineación tipo tijera de Hunter Engineering, con cuatro capacidades y varias longitudes de distancia entre ejes disponibles, alturas de acceso bajas y configuraciones de montaje empotrado opcionales.",
    categoryId: CATEGORY.elevacion,
    warrantyMonths: 36,
    isSerialized: true,
    image: "liftrack-scissor.jpg",
    sourceUrl: "https://es.hunter.com/es-int/rampas-alineacion/rampas-tijera/",
    attrs: [],
  },
  {
    sku: "HUNTER-LIFTRACK-CUATRO-POSTES",
    slug: "hunter-elevadores-cuatro-postes",
    name: "Hunter Elevadores de cuatro postes",
    shortDescription: "Elevador de cuatro postes de alta capacidad para alineación, con gatos neumáticos y plataformas deslizantes integradas.",
    description:
      "Rampa de alineación de cuatro postes de Hunter Engineering, de alta producción y elevación pesada, con distancias entre ejes de 177 o 211 pulgadas, gatos neumáticos oscilantes de serie y platos giratorios de acero inoxidable.",
    categoryId: CATEGORY.elevacion,
    warrantyMonths: 36,
    isSerialized: true,
    image: "liftrack-fourpost.jpg",
    sourceUrl: "https://es.hunter.com/es-int/rampas-alineacion/elevadores-de-cuatro-postes/",
    attrs: [{ id: ATTR.el_capacidadCarga, dataType: "number", value: "8165" }],
  },
  {
    sku: "HUNTER-LIFTRACK-FOSA",
    slug: "hunter-rampas-de-fosa",
    name: "Hunter Rampas de fosa para alineación",
    shortDescription: "Rampa de fosa con acceso perimetral y gran capacidad, permite instalar gatos móviles adicionales.",
    description:
      "Rampa de fosa para alineación de Hunter Engineering, con comodidad de acceso perimetral alrededor del vehículo y capacidad para instalar dos gatos móviles adicionales.",
    categoryId: CATEGORY.elevacion,
    warrantyMonths: 36,
    isSerialized: true,
    image: "liftrack-pit.jpg",
    sourceUrl: "https://es.hunter.com/es-int/rampas-alineacion/rampas-de-fosa/",
    attrs: [{ id: ATTR.el_capacidadCarga, dataType: "number", value: "8164" }],
  },
];

async function ensureHunterBrand() {
  const { data: existing } = await supabase.from("brands").select("id").eq("slug", "hunter-engineering").maybeSingle();
  if (existing) return existing.id;
  const { data, error } = await supabase
    .from("brands")
    .insert({ slug: "hunter-engineering", name: "Hunter Engineering", is_active: true })
    .select("id")
    .single();
  if (error) throw new Error(`No se pudo crear la marca Hunter: ${error.message}`);
  return data.id;
}

async function uploadImage(productId, fileName) {
  const body = readFileSync(`${IMG_DIR}/${fileName}`);
  const key = `products/${productId}/images/${Date.now()}-${fileName}`;
  await s3.send(new PutObjectCommand({ Bucket: R2.bucketName, Key: key, Body: body, ContentType: "image/jpeg" }));
  return `${R2.publicUrl.replace(/\/$/, "")}/${key}`;
}

async function main() {
  const brandId = await ensureHunterBrand();
  console.log(`Marca Hunter Engineering: ${brandId}`);

  for (const p of PRODUCTS) {
    const { data: existing } = await supabase.from("products").select("id").eq("sku", p.sku).maybeSingle();
    let productId = existing?.id;

    if (!productId) {
      const { data, error } = await supabase
        .from("products")
        .insert({
          sku: p.sku,
          slug: p.slug,
          name: p.name,
          short_description: p.shortDescription,
          description: p.description,
          type: "equipment",
          category_id: p.categoryId,
          brand_id: brandId,
          is_serialized: p.isSerialized,
          warranty_months: p.warrantyMonths,
          is_active: false,
          is_featured: false,
          is_bestseller: false,
        })
        .select("id")
        .single();
      if (error) throw new Error(`No se pudo crear ${p.sku}: ${error.message}`);
      productId = data.id;
      console.log(`Creado ${p.sku} -> ${productId}`);
    } else {
      console.log(`Ya existía ${p.sku} -> ${productId}, reutilizando`);
    }

    const { count } = await supabase.from("product_images").select("id", { count: "exact", head: true }).eq("product_id", productId);
    if (!count) {
      const url = await uploadImage(productId, p.image);
      await supabase.from("product_images").insert({ product_id: productId, url, alt: p.name, position: 0, is_primary: true });
      console.log(`  Imagen subida: ${url}`);
    }

    if (p.attrs.length > 0) {
      await supabase.from("product_attributes").delete().eq("product_id", productId);
      const rows = p.attrs.map((a) => {
        const base = { product_id: productId, definition_id: a.id };
        if (a.dataType === "number") return { ...base, value_number: Number.parseFloat(a.value) };
        return { ...base, value_text: a.value };
      });
      const { error } = await supabase.from("product_attributes").insert(rows);
      if (error) throw new Error(`No se pudieron guardar specs de ${p.sku}: ${error.message}`);
      console.log(`  ${rows.length} spec(s) guardadas`);
    }
  }

  console.log("\nListo. Todos los productos quedaron is_active=false (borrador) — revisar y publicar desde /admin/productos.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
