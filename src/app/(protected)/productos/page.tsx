import { createClient } from "@/lib/supabase/server";
import { ProductosClientLayout } from "@/components/productos/ProductosClientLayout";
import { ProductosToolbar } from "@/components/productos/ProductosToolbar";
import { ProductsGrid } from "@/components/productos/ProductsGrid";
import { ilikeContainsPattern } from "@/lib/productoSpecs";
import type { LineaProduccion, Material, ProductoCard } from "@/lib/types/productos";

type SearchParams = Promise<{ linea?: string; material?: string; q?: string }>;

export default async function ProductosPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const supabase = await createClient();
  const params = await searchParams;
  const lineaFiltro = params.linea ? Number(params.linea) : undefined;
  const materialFiltro = params.material ? Number(params.material) : undefined;
  const textoBusqueda = (params.q ?? "").trim().replace(/,/g, " ");

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
    "id,codigo,descripcion,estado,linea:linea_produccion(id,nombre),material:material(id,nombre,abreviatura),espec_inyeccion(*),espec_soplado(*)",
  );
  if (lineaFiltro) query = query.eq("linea_id", lineaFiltro);
  if (materialFiltro) query = query.eq("material_id", materialFiltro);

  if (textoBusqueda.length > 0) {
    const patron = ilikeContainsPattern(textoBusqueda);
    query = query.or(`codigo.ilike.${patron},descripcion.ilike.${patron}`);
  }

  const { data: productsRaw } = await query.order("id", { ascending: false });

  const products: ProductoCard[] = (productsRaw ?? []).map((row: any) => ({
    id: row.id,
    codigo: row.codigo,
    descripcion: row.descripcion,
    estado: row.estado,
    linea: Array.isArray(row.linea) ? row.linea[0] ?? null : row.linea,
    material: Array.isArray(row.material) ? row.material[0] ?? null : row.material,
    espec_inyeccion: Array.isArray(row.espec_inyeccion) ? row.espec_inyeccion[0] ?? null : row.espec_inyeccion,
    espec_soplado: Array.isArray(row.espec_soplado) ? row.espec_soplado[0] ?? null : row.espec_soplado,
  }));

  return (
    <ProductosClientLayout lineas={lineas} materiales={materiales}>
      <ProductosToolbar lineas={lineas} materiales={materiales} />

      <ProductsGrid products={products} />
    </ProductosClientLayout>
  );
}
