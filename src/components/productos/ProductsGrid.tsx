"use client";

import { useEffect, useId, useState } from "react";
import type { ProductoCard } from "@/lib/types/productos";
import { getDetallesSecciones, getPreviewPesoDiametro, resolveSpecKind } from "@/lib/productoSpecs";

export function ProductsGrid({ products }: { products: ProductoCard[] }) {
  const [detalle, setDetalle] = useState<ProductoCard | null>(null);
  const dialogTitleId = useId();

  useEffect(() => {
    if (!detalle) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDetalle(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [detalle]);

  if (!products.length) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500 dark:border-zinc-700">
        No hay productos que coincidan con la búsqueda o los filtros.
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        {products.map((p) => {
          const kind = resolveSpecKind(p);
          const procesoEtiqueta =
            kind === "inyeccion" ? "Inyección" : kind === "soplado" ? "Soplado" : "Sin datos de proceso";
          const { peso, diametro } = getPreviewPesoDiametro(p);
          return (
            <article
              key={p.id}
              className="flex flex-col rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition duration-200 ease-out hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-600 dark:hover:shadow-lg dark:hover:shadow-black/20"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{p.codigo}</p>
                  <h3 className="mt-1 text-base font-semibold leading-snug">{p.descripcion}</h3>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-1 text-xs ${p.estado === "activo" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200" : "bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200"}`}
                >
                  {p.estado}
                </span>
              </div>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                Línea: <strong>{p.linea?.nombre ?? "—"}</strong> · Material:{" "}
                <strong>{p.material?.abreviatura ?? "—"}</strong>
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-md bg-zinc-50 px-3 py-2 dark:bg-zinc-900/60">
                  <p className="text-xs text-zinc-500">Peso</p>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">{peso}</p>
                </div>
                <div className="rounded-md bg-zinc-50 px-3 py-2 dark:bg-zinc-900/60">
                  <p className="text-xs text-zinc-500">Diámetro</p>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">{diametro}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between gap-2">
                <span className="text-xs text-zinc-500">Proceso: {procesoEtiqueta}</span>
                <button
                  type="button"
                  onClick={() => setDetalle(p)}
                  className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-900"
                >
                  Más detalles
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {detalle ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
          role="presentation"
          onClick={() => setDetalle(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={dialogTitleId}
            className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-950"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{detalle.codigo}</p>
                <h2 id={dialogTitleId} className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                  {detalle.descripcion}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setDetalle(null)}
                className="rounded-md p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>
            <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
              {detalle.linea?.nombre ?? "—"} · {detalle.material?.abreviatura ?? "—"}
            </p>
            <div className="mt-4 border-t border-zinc-200 pt-4 dark:border-zinc-800">
              {(() => {
                const secciones = getDetallesSecciones(detalle);
                if (!secciones.length) {
                  return (
                    <p className="text-sm text-zinc-500">
                      No hay especificaciones con valores en la base de datos para este producto (o no se pudieron cargar las
                      tablas relacionadas).
                    </p>
                  );
                }
                return (
                  <div className="space-y-6">
                    {secciones.map((sec) => (
                      <div key={sec.titulo}>
                        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">{sec.titulo}</h3>
                        <dl className="space-y-2 text-sm">
                          {sec.filas.map((f) => (
                            <div
                              key={`${sec.titulo}-${f.clave}`}
                              className="flex justify-between gap-4 border-b border-zinc-100 py-2 last:border-0 dark:border-zinc-800/80"
                            >
                              <dt className="text-zinc-600 dark:text-zinc-400">{f.etiqueta}</dt>
                              <dd className="font-medium text-zinc-900 dark:text-zinc-100">{f.valor}</dd>
                            </div>
                          ))}
                        </dl>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
