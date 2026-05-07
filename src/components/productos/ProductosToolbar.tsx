"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { LineaProduccion, Material } from "@/lib/types/productos";

function setParam(sp: URLSearchParams, key: string, value: string | undefined) {
  if (value === undefined || value === "") sp.delete(key);
  else sp.set(key, value);
}

export function ProductosToolbar({
  lineas,
  materiales,
}: {
  lineas: LineaProduccion[];
  materiales: Material[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const linea = searchParams.get("linea") ?? "";
  const material = searchParams.get("material") ?? "";
  const qUrl = searchParams.get("q") ?? "";

  const [qInput, setQInput] = useState(qUrl);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setQInput(qUrl);
  }, [qUrl]);

  const replaceQuery = (next: URLSearchParams) => {
    const s = next.toString();
    router.replace(s ? `${pathname}?${s}` : pathname);
  };

  useEffect(() => {
    if (qInput.trim() === qUrl) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const trimmed = qInput.trim().replace(/,/g, " ");
      const sp = new URLSearchParams(searchParams.toString());
      setParam(sp, "q", trimmed || undefined);
      replaceQuery(sp);
    }, 320);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [qInput, qUrl, pathname, router, searchParams]);

  const aplicarFiltros = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const sp = new URLSearchParams();
    const qKeep = searchParams.get("q");
    if (qKeep) sp.set("q", qKeep);
    const l = String(fd.get("linea") ?? "");
    const m = String(fd.get("material") ?? "");
    setParam(sp, "linea", l || undefined);
    setParam(sp, "material", m || undefined);
    replaceQuery(sp);
  };

  const limpiarTodo = () => {
    setQInput("");
    router.replace(pathname);
  };

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
      <form onSubmit={aplicarFiltros} className="flex flex-col gap-4">
        <div>
          <label htmlFor="busqueda" className="mb-1 block text-sm font-medium">
            Buscar por código o descripción
          </label>
          <input
            id="busqueda"
            name="busqueda"
            type="search"
            autoComplete="off"
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-zinc-400 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:ring-zinc-800"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label htmlFor="linea" className="mb-1 block text-sm font-medium">
              Línea
            </label>
            <select
              id="linea"
              name="linea"
              defaultValue={linea}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            >
              <option value="">Todas</option>
              {lineas.map((lineaOpt) => (
                <option key={lineaOpt.id} value={lineaOpt.id}>
                  {lineaOpt.nombre}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="material" className="mb-1 block text-sm font-medium">
              Material
            </label>
            <select
              id="material"
              name="material"
              defaultValue={material}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            >
              <option value="">Todos</option>
              {materiales.map((mat) => (
                <option key={mat.id} value={mat.id}>
                  {mat.nombre} ({mat.abreviatura})
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <button
              type="submit"
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
            >
              Aplicar filtros
            </button>
            <button
              type="button"
              onClick={limpiarTodo}
              className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium"
            >
              Limpiar todo
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}
