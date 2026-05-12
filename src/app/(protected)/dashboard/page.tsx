import { createClient } from "@/lib/supabase/server";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { GroqRecommendations } from "@/components/dashboard/GroqRecommendations";
import { buildSummaryForGroq, computeAnalytics } from "@/services/analyticsService";
import type { EventoRow } from "@/lib/types/events";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("eventos")
    .select(
      'id,user_id,type,payload,"timestamp",producto_id,maquina_id,operario_id,encargado_id,cliente_id,pedido_id,vendedor_id,turno,cantidad,merma,defecto,falla_maquina',
    )
    .order('"timestamp"', { ascending: false });

  const rows: EventoRow[] = (data ?? []).map((row) => ({
    id: row.id,
    user_id: row.user_id,
    type: row.type as EventoRow["type"],
    payload: row.payload as EventoRow["payload"],
    timestamp: row.timestamp,
    producto_id: row.producto_id,
    maquina_id: row.maquina_id,
    operario_id: row.operario_id,
    encargado_id: row.encargado_id,
    cliente_id: row.cliente_id,
    pedido_id: row.pedido_id,
    vendedor_id: row.vendedor_id,
    turno: row.turno,
    cantidad: row.cantidad,
    merma: row.merma,
    defecto: row.defecto,
    falla_maquina: row.falla_maquina,
  }));

  const analytics = computeAnalytics(rows);
  const summary = buildSummaryForGroq(analytics);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Panel de control
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Métricas calculadas a partir de la tabla de eventos. {error ? `Aviso: ${error.message}` : null}
        </p>
      </div>

      <DashboardStats analytics={analytics} />

      <GroqRecommendations summary={summary} />
    </div>
  );
}
