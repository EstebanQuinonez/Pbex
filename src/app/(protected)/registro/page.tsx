import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { DefectForm } from "@/components/forms/DefectForm";
import { MermaForm } from "@/components/forms/MermaForm";
import { ProductionForm } from "@/components/forms/ProductionForm";
import type { RegistroCatalogs } from "@/lib/types/registro-catalog";
import { loadProduccionesParaMerma } from "@/app/(protected)/registro/load-producciones-merma";

async function loadRegistroCatalogs(supabase: SupabaseClient): Promise<RegistroCatalogs> {
  const [pr, ma, en, op, fm] = await Promise.all([
    supabase.from("producto").select("id,codigo,descripcion,linea_id").eq("estado", "activo").order("codigo"),
    supabase.from("maquinas").select("id,codigo,nombre,linea_id").order("codigo"),
    supabase.from("encargados_linea").select("id,nombre,linea_id,turno").order("nombre"),
    supabase.from("operarios").select("id,nombre,turno").eq("estado", "activo").order("nombre"),
    supabase.from("fallas_maquina").select("id,nombre").order("id"),
  ]);

  return {
    productos: (pr.data ?? []) as RegistroCatalogs["productos"],
    maquinas: (ma.data ?? []) as RegistroCatalogs["maquinas"],
    encargados: (en.data ?? []) as RegistroCatalogs["encargados"],
    operarios: (op.data ?? []) as RegistroCatalogs["operarios"],
    fallas_maquina: (fm.data ?? []) as RegistroCatalogs["fallas_maquina"],
  };
}

export default async function RegistroPage() {
  const supabase = await createClient();
  const [catalogs, produccionesParaMerma] = await Promise.all([
    loadRegistroCatalogs(supabase),
    loadProduccionesParaMerma(supabase),
  ]);
  const sinCatalogo =
    catalogs.productos.length === 0 ||
    catalogs.maquinas.length === 0 ||
    catalogs.encargados.length === 0 ||
    catalogs.operarios.length === 0 ||
    catalogs.fallas_maquina.length === 0;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Registros de planta
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          <strong>Producción</strong>: cantidad en bruto. <strong>Merma</strong>: descuentos ligados a la misma
          referencia de producción (tipo de defecto y cantidad). <strong>Fallas de máquina</strong>: reportes de
          mantenimiento.
        </p>
        {sinCatalogo ? (
          <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/50 dark:text-amber-100">
            Faltan datos maestros (productos, máquinas, personal u opciones de falla). Solicita a administración que
            complete los catálogos antes de registrar en planta.
          </p>
        ) : null}
      </div>
      <div className="grid gap-8 lg:grid-cols-2">
        <ProductionForm catalogs={catalogs} />
        <MermaForm catalogs={catalogs} producciones={produccionesParaMerma} />
      </div>
      <div className="max-w-2xl">
        <DefectForm catalogs={{ maquinas: catalogs.maquinas, fallas_maquina: catalogs.fallas_maquina }} />
      </div>
    </div>
  );
}
