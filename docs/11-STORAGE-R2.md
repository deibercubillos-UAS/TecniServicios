# 11 — Almacenamiento (Cloudflare R2)

Volver a [`00-INDEX.md`](./00-INDEX.md)

---

## 1. Qué se guarda ahí

| Contenido | Tabla | Público / privado |
|---|---|---|
| Imágenes de producto | `product_images` | Público — el catálogo las sirve a cualquiera |
| Foto hero de categoría | `categories.image_url` (una sola, no es tabla aparte) | Público — `categories_read_public` ya cubre la columna |
| Manuales de postventa | `product_documents` (`is_public = false`, único caso real hoy) | Privado — solo dueño del equipo (regla 5.5) o master |

**La ficha técnica no se sube como archivo.** No hay forma de analizar un PDF
subido para mostrarlo estructurado, así que master la llena campo por campo en
`/admin/productos/[id]` — sección "Especificaciones técnicas", sobre
`attribute_definitions`/`product_attributes` (ver `docs/12-MODULE-CATALOG.md`).
`product_documents.is_public = true` sigue existiendo en el esquema y en RLS
por si aparece otro tipo de documento público a futuro, pero el flujo de
carga de producto ya no lo ofrece.

RLS de `product_documents`: `product_documents_read_public` (cualquiera si
`is_public`), `product_documents_read_owner` (dueño del equipo o master si no
es público), `product_documents_write_master` (solo master escribe). Ver
`docs/05-RLS-SECURITY-C.md`.

---

## 2. Variables de entorno

Ya están en `packages/shared/src/env.ts`, todas opcionales hasta que se
configuren en Vercel (`docs/19-DEPLOYMENT.md`):

| Variable | Uso |
|---|---|
| `R2_ACCOUNT_ID` | Endpoint S3-compatible: `https://{id}.r2.cloudflarestorage.com` |
| `R2_ACCESS_KEY_ID` | Credencial de escritura |
| `R2_SECRET_ACCESS_KEY` | **Crítico** — nunca en el cliente, solo Server Actions |
| `R2_BUCKET_NAME` | Bucket donde se sube todo |
| `R2_PUBLIC_URL` | Dominio público servido por Cloudflare (custom domain o `r2.dev`) |

Si faltan, `uploadToR2`/`deleteFromR2` (`packages/integrations/src/r2/client.ts`)
lanzan en vez de fallar en silencio.

---

## 3. Cómo se sube un archivo

1. El master sube el archivo desde un `<form>` en `/admin/productos/[id]`
   (Server Action, `multipart/form-data`).
2. La Server Action lee el `File` a `Buffer`, arma la key con
   `buildProductAssetKey("images" | "documents", productId, fileName)` —
   formato `products/{productId}/{kind}/{timestamp}-{nombre-sanitizado}`.
3. `uploadToR2` sube el buffer y devuelve la URL pública.
4. `packages/core` inserta la fila (`product_images` o `product_documents`)
   con esa URL — nunca se guarda la key sin la fila, ni la fila sin haber
   subido primero (si la subida falla, no se inserta nada).

Borrar sigue el mismo orden invertido: se borra la fila primero (si el
`DELETE` de R2 falla después, queda un objeto huérfano en el bucket, que es
preferible a una fila apuntando a un archivo que ya no existe).

---

## 4. Límites

- Tipo de archivo: imágenes (`image/*`) para `product_images`; cualquier
  documento (`application/pdf` típicamente) para `product_documents`.
- Tamaño: sin límite propio todavía — lo que permita el `Server Action`
  de Next.js (`bodySizeLimit`, default 1MB, se sube según necesidad real
  cuando aparezca el primer archivo que lo requiera; no se fija un número
  arbitrario de antemano).

## 5. Verificación en producción

Este entorno de desarrollo no tiene credenciales R2 reales — el código se
construyó completo (`packages/integrations/src/r2/client.ts`) pero no se
puede probar la subida real acá. Antes de dar por buena la función en
producción:

1. `vercel env pull` para traer las `R2_*` reales.
2. Subir una imagen de prueba desde `/admin/productos/[id]` y confirmar que
   la URL pública carga.
3. Confirmar en el dashboard de Cloudflare R2 que el objeto aparece con la
   key esperada.
