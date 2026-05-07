import { createClient } from "@/lib/supabase/server";
import { CatalogForms } from "@/components/productos/CatalogForms";
import { ProductForm } from "@/components/productos/ProductForm";
import { ProductsGrid } from "@/components/productos/ProductsGrid";
import type { LineaProduccion, Material, ProductoCard } from "@/lib/types/productos";

type SearchParams = Promise<{ linea?: string; material?: string }>;

export default async function ProductosPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const supabase = await createClient();
  const params = await searchParams;
  const lineaFiltro = params.linea ? Number(params.linea) : undefined;
  const materialFiltro = params.material ? Number(params.material) : undefined;

  const { data: lineasRaw } = await supabase
    .from("linea_produccion")
    .select("id,nombre,descripcion")
    .order("nombre", { ascending: true });
  const lineas: LineaProduccion[] = (lineasRaw ?? []) as LineaProduccion[];

  const { data: materialesRaw } = await supabase
    .from("material")
    .select("id,nombre,abreviatura")
    .order("nombre", { ascending: true });
  const materiales: Material[] = (materialesRaw ?? []) as Material[];

  let query = supabase.from("producto").select(
    "id,codigo,descripcion,color,estado,creado_en,linea:linea_produccion(id,nombre),material:material(id,nombre,abreviatura),espec_inyeccion(*),espec_soplado(*)",
  );
  if (lineaFiltro) query = query.eq("linea_id", lineaFiltro);
  if (materialFiltro) query = query.eq("material_id", materialFiltro);
  const { data: productsRaw } = await query.order("creado_en", { ascending: false });

  const products: ProductoCard[] = (productsRaw ?? []).map((row: any) => ({
    id: row.id,
    codigo: row.codigo,
    descripcion: row.descripcion,
    color: row.color,
    estado: row.estado,
    creado_en: row.creado_en,
    linea: Array.isArray(row.linea) ? row.linea[0] ?? null : row.linea,
    material: Array.isArray(row.material) ? row.material[0] ?? null : row.material,
    espec_inyeccion: Array.isArray(row.espec_inyeccion) ? row.espec_inyeccion[0] ?? null : row.espec_inyeccion,
    espec_soplado: Array.isArray(row.espec_soplado) ? row.espec_soplado[0] ?? null : row.espec_soplado,
  }));

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Productos</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Catálogo de líneas, materiales y productos con especificación por proceso.
        </p>
      </div>

      <CatalogForms />

      <ProductForm lineas={lineas} materiales={materiales} />

      <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
        <form className="grid gap-4 md:grid-cols-3">
          <div>
            <label htmlFor="linea" className="mb-1 block text-sm font-medium">Filtrar por línea</label>
            <select id="linea" name="linea" defaultValue={lineaFiltro ? String(lineaFiltro) : ""} className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950">
              <option value="">Todas</option>
              {lineas.map((linea) => (
                <option key={linea.id} value={linea.id}>{linea.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="material" className="mb-1 block text-sm font-medium">Filtrar por material</label>
            <select id="material" name="material" defaultValue={materialFiltro ? String(materialFiltro) : ""} className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950">
              <option value="">Todos</option>
              {materiales.map((material) => (
                <option key={material.id} value={material.id}>
                  {material.nombre} ({material.abreviatura})
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end gap-2">
            <button type="submit" className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900">
              Aplicar filtros
            </button>
            <a href="/productos" className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium">
              Limpiar
            </a>
          </div>
        </form>
      </section>

      <ProductsGrid products={products} />
    </div>
  );
}
