import type { Metadata } from "next";
import Link from "next/link";

import { ProductImportWizard } from "@/components/product-import-wizard";

export const metadata: Metadata = {
  title: "Importar productos — Panel maestro",
};

export default function ImportarProductosPage() {
  return (
    <div className="mx-auto flex max-w-[900px] flex-col gap-6 px-4 py-12 sm:py-16">
      <div>
        <h1 className="text-2xl font-bold text-text">Importar productos</h1>
        <p className="text-sm text-text-muted">
          Carga masiva desde el Excel de Siigo. Crea o actualiza por SKU — nunca toca precio ni stock, eso sigue viniendo de la
          sincronización con Siigo.
        </p>
      </div>

      <ProductImportWizard />

      <Link href="/admin/productos" className="w-fit text-sm font-medium text-brand hover:underline">
        Ver productos
      </Link>
    </div>
  );
}
