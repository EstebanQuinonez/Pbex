import { createClient } from "@/lib/supabase/server";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { GroqRecommendations } from "@/components/dashboard/GroqRecommendations";
import { buildSummaryForGroq, computeAnalytics } from "@/services/analyticsService";
import type { EventoRow } from "@/lib/types/events";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("eventos")
    .select("id,user_id,tipo,payload,created_at")
    .order("created_at", { ascending: false });

  const rows: EventoRow[] = (data ?? []).map((row) => ({
    id: row.id,
    user_id: row.user_id,
    tipo: row.tipo as EventoRow["tipo"],
    payload: row.payload as EventoRow["payload"],
    created_at: row.created_at,
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
