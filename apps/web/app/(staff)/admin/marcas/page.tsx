import { redirect } from "next/navigation";

/** El listado de marcas se unió con el de categorías en una sola pantalla
 * (/admin/categorias?seccion=marcas) — mismo patrón de tarjetas con
 * miniatura, conteo y estado. Esta ruta se conserva solo para no romper
 * enlaces existentes (nav antigua, marcadores). */
export default function AdminMarcasPage() {
  redirect("/admin/categorias?seccion=marcas");
}
