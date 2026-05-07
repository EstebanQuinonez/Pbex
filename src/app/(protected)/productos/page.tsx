import { createClient } from "@/lib/supabase/server";
import { ProductosClientLayout } from "@/components/productos/ProductosClientLayout";
import { ProductosToolbar } from "@/components/productos/ProductosToolbar";
import { ProductsGrid } from "@/components/productos/ProductsGrid";
import { ilikeContainsPattern } from "@/lib/productoSpecs";
import type { LineaProduccion, Material, ProductoCard } from "@/lib/types/productos";

type SearchParams = Promise<{ linea?: string; material?: string; q?: string }>;

function firstEmbedded<T>(v: T | T[] | null | undefined): T | null {
  if (v == null) return null;
  if (Array.isArray(v)) return v[0] ?? null;
  if (typeof v === "object" && Object.keys(v as object).length === 0) return null;
  return v;
}

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
    linea: firstEmbedded(row.linea),
    material: firstEmbedded(row.material),
    espec_inyeccion: firstEmbedded(row.espec_inyeccion),
    espec_soplado: firstEmbedded(row.espec_soplado),
  }));

  return (
    <ProductosClientLayout lineas={lineas} materiales={materiales}>
      <ProductosToolbar lineas={lineas} materiales={materiales} />

      <ProductsGrid products={products} />
    </ProductosClientLayout>
  );
}
