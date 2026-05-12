import { createClient } from "@/lib/supabase/server";
import { DashboardPlantClient } from "@/components/dashboard/DashboardPlantClient";
import {
  buildNarrativeSummary,
  buildStructuredRecommendationContext,
  fetchDashboardKpis,
  parseDashboardFilters,
} from "@/services/dashboardKpiService";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function DashboardPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = await createClient();
  const params = await searchParams;
  const filters = parseDashboardFilters(params);

  const [kpiResult, maquinasRes] = await Promise.all([
    fetchDashboardKpis(supabase, filters),
    supabase.from("maquinas").select("id,codigo,nombre").order("codigo", { ascending: true }),
  ]);

  const maquinas = (maquinasRes.data ?? []).map((m) => ({
    id: Number(m.id),
    codigo: String(m.codigo),
    nombre: String(m.nombre),
  }));

  const kpi = kpiResult.data;
  const narrativeSummary =
    kpi != null
      ? buildNarrativeSummary(kpi, filters)
      : "No hay datos agregados disponibles; revisa la conexión a Supabase o la migración del dashboard.";
  const structuredContext = kpi != null ? buildStructuredRecommendationContext(kpi, filters) : {};

  return (
    <div className="flex flex-col gap-8">
      <header className="border-b border-zinc-200 pb-6 dark:border-zinc-800">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Tablero de planta
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          Vista para gerencia: KPIs y series calculados en base de datos (una RPC por vista), con filtros por
          periodo, máquina y turno. Las recomendaciones usan los mismos datos agregados que ves en pantalla.
        </p>
      </header>

      <DashboardPlantClient
        kpi={kpi}
        kpiError={kpiResult.error}
        maquinas={maquinas}
        filters={filters}
        narrativeSummary={narrativeSummary}
        structuredContext={structuredContext}
      />
    </div>
  );
}
