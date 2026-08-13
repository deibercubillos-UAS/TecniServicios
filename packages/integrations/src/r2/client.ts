import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

export interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicUrl: string;
}

export interface UploadToR2Input {
  key: string;
  body: Buffer;
  contentType: string;
}

export interface UploadToR2Result {
  key: string;
  url: string;
  size: number;
}

function buildClient(config: R2Config): S3Client {
  return new S3Client({
    region: "auto",
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey },
  });
}

/**
 * Cliente R2 real (S3-compatible) — docs/11-STORAGE-R2.md. Nunca se
 * llama con credenciales fabricadas: `config` viene siempre de
 * `serverEnv.R2_*`, y si esas variables no están configuradas en el
 * entorno, la función lanza en vez de intentar una subida silenciosa
 * que fallaría de forma confusa más abajo.
 */
export async function uploadToR2(config: R2Config, input: UploadToR2Input): Promise<UploadToR2Result> {
  const client = buildClient(config);
  await client.send(
    new PutObjectCommand({
      Bucket: config.bucketName,
      Key: input.key,
      Body: input.body,
      ContentType: input.contentType,
    }),
  );

  return {
    key: input.key,
    url: `${config.publicUrl.replace(/\/$/, "")}/${input.key}`,
    size: input.body.byteLength,
  };
}

export async function deleteFromR2(config: R2Config, key: string): Promise<void> {
  const client = buildClient(config);
  await client.send(new DeleteObjectCommand({ Bucket: config.bucketName, Key: key }));
}

/** Key determinística por producto — evita colisiones entre productos y
 * facilita borrar todo lo de un producto si algún día se necesita. */
export function buildProductAssetKey(kind: "images" | "documents", productId: string, fileName: string): string {
  const safeName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  return `products/${productId}/${kind}/${Date.now()}-${safeName}`;
}

/** Key determinística por categoría — una sola foto hero por categoría
 * (`categories.image_url`), no una lista como `product_images`. */
export function buildCategoryAssetKey(categoryId: string, fileName: string): string {
  const safeName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  return `categories/${categoryId}/${Date.now()}-${safeName}`;
}

/** Key determinística por marca — un solo logo por marca
 * (`brands.logo_url`), mismo patrón que la foto de categoría. */
export function buildBrandAssetKey(brandId: string, fileName: string): string {
  const safeName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  return `brands/${brandId}/${Date.now()}-${safeName}`;
}
