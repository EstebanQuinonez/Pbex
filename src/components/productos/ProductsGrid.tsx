import type { ProductoCard } from "@/lib/types/productos";

export function ProductsGrid({ products }: { products: ProductoCard[] }) {
  if (!products.length) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500 dark:border-zinc-700">
        No hay productos para los filtros seleccionados.
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {products.map((p) => {
        const isIny = !!p.espec_inyeccion;
        return (
          <article key={p.id} className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{p.codigo}</p>
                <h3 className="mt-1 text-base font-semibold">{p.descripcion}</h3>
              </div>
              <span className={`rounded-full px-2 py-1 text-xs ${p.estado === "activo" ? "bg-emerald-100 text-emerald-800" : "bg-zinc-200 text-zinc-700"}`}>
                {p.estado}
              </span>
            </div>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
              Línea: <strong>{p.linea?.nombre ?? "-"}</strong> · Material:{" "}
              <strong>{p.material?.abreviatura ?? "-"}</strong>
              {p.color ? ` · Color: ${p.color}` : ""}
            </p>
            <div className="mt-3 text-xs text-zinc-500">
              Proceso: {isIny ? "Inyección" : "Soplado"}
            </div>
          </article>
        );
      })}
    </div>
  );
}
