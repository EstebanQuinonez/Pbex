"use client";

import { useState, type ReactNode } from "react";
import { CatalogForms } from "@/components/productos/CatalogForms";
import { ProductForm } from "@/components/productos/ProductForm";
import type { LineaProduccion, Material } from "@/lib/types/productos";

export function ProductosClientLayout({
  lineas,
  materiales,
  children,
}: {
  lineas: LineaProduccion[];
  materiales: Material[];
  children: ReactNode;
}) {
  const [abierto, setAbierto] = useState(false);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Productos</h1>
          <p className="mt-1 max-w-xl text-sm text-zinc-600 dark:text-zinc-400">
            Catálogo de productos por línea y material. Usa los filtros para acotar la lista.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAbierto((v) => !v)}
          className="shrink-0 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {abierto ? "Cerrar formulario" : "Agregar nuevo producto"}
        </button>
      </div>

      {abierto ? (
        <section
          className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-6 dark:border-zinc-800 dark:bg-zinc-900/40"
          aria-label="Formulario de nuevo producto"
        >
          <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
            Si necesitas una línea o material nuevo, créalos primero. Luego completa el producto y la especificación
            según el tipo de línea (inyección o soplado).
          </p>
          <div className="flex flex-col gap-8">
            <CatalogForms />
            <ProductForm lineas={lineas} materiales={materiales} />
          </div>
        </section>
      ) : null}

      {children}
    </div>
  );
}
