import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProductForm } from "@/components/productos/ProductForm";
import type { LineaProduccion, Material, ProductoEditDefaults } from "@/lib/types/productos";

function firstEmbedded<T>(v: T | T[] | null | undefined): T | null {
  if (v == null) return null;
  if (Array.isArray(v)) return v[0] ?? null;
  return v;
}

function normalizeSpecRow(obj: Record<string, unknown>): Record<string, string | null> {
  const out: Record<string, string | null> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (k === "id" || k === "producto_id") continue;
    if (v === null || v === undefined) out[k] = null;
    else out[k] = String(v);
  }
  return out;
}

export default async function EditProductoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const nid = Number(id);
  if (!Number.isFinite(nid)) notFound();

  const supabase = await createClient();
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/login");
  } catch {
    redirect("/login");
  }

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

  const { data: row, error } = await supabase
    .from("producto")
    .select("id,codigo,descripcion,linea_id,material_id,estado")
    .eq("id", nid)
    .maybeSingle();

  if (error || !row) notFound();

  const [{ data: inyRows }, { data: sopRows }] = await Promise.all([
    supabase.from("espec_inyeccion").select("*").eq("producto_id", nid).limit(1),
    supabase.from("espec_soplado").select("*").eq("producto_id", nid).limit(1),
  ]);

  const iny = firstEmbedded<Record<string, unknown>>(inyRows as never);
  const sop = firstEmbedded<Record<string, unknown>>(sopRows as never);

  const defaults: ProductoEditDefaults = {
    id: row.id,
    codigo: row.codigo,
    descripcion: row.descripcion,
    linea_id: row.linea_id,
    material_id: row.material_id,
    estado: row.estado as "activo" | "inactivo",
    espec_inyeccion: iny ? normalizeSpecRow(iny as Record<string, unknown>) : null,
    espec_soplado: sop ? normalizeSpecRow(sop as Record<string, unknown>) : null,
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/productos" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
          ← Volver a productos
        </Link>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Editar producto</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Código <span className="font-mono text-xs">{defaults.codigo}</span>. Las especificaciones son opcionales; deja vacío lo que no aplique.
        </p>
      </div>
      <ProductForm mode="edit" lineas={lineas} materiales={materiales} defaults={defaults} />
    </div>
  );
}
