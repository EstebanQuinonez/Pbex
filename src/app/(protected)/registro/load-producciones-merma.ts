import type { SupabaseClient } from "@supabase/supabase-js";
import { grossFromProductionRow } from "@/lib/productionQuantities";
import type { ProduccionParaMerma } from "@/lib/types/registro-catalog";

export async function loadProduccionesParaMerma(supabase: SupabaseClient): Promise<ProduccionParaMerma[]> {
  const { data: prods, error } = await supabase
    .from("eventos")
    .select("id,timestamp,cantidad,producto_id,maquina_id,turno,payload")
    .eq("type", "PRODUCTION_RECORDED")
    .order("timestamp", { ascending: false })
    .limit(200);

  if (error || !prods?.length) return [];

  const ids = prods.map((p) => p.id as string);
  const { data: mrows, error: mErr } = await supabase
    .from("eventos")
    .select("produccion_evento_id,merma")
    .eq("type", "MERMA_RECORDED")
    .in("produccion_evento_id", ids);

  const sumBy = new Map<string, number>();
  if (!mErr && mrows) {
    for (const r of mrows) {
      const ref = r.produccion_evento_id as string | null | undefined;
      if (!ref) continue;
      sumBy.set(ref, (sumBy.get(ref) ?? 0) + Number(r.merma ?? 0));
    }
  }

  return prods
    .map((p) => {
      const id = String(p.id);
      const bruta = grossFromProductionRow({
        cantidad: p.cantidad as number | null,
        payload: p.payload,
      });
      const merma_acumulada = sumBy.get(id) ?? 0;
      const disponible = Math.max(0, bruta - merma_acumulada);
      return {
        id,
        timestamp: String(p.timestamp),
        cantidad_bruta: bruta,
        merma_acumulada,
        disponible,
        producto_id: p.producto_id != null ? Number(p.producto_id) : null,
        maquina_id: p.maquina_id != null ? Number(p.maquina_id) : null,
        turno: p.turno != null ? String(p.turno) : null,
      };
    })
    .filter((row) => row.cantidad_bruta > 0);
}
