import type { SupabaseClient } from "@supabase/supabase-js";
import { kpiDashboardSchema, type KpiDashboard } from "@/lib/types/dashboard-kpi";

export type DashboardFilters = {
  desde: string;
  hasta: string;
  maquinaId: number | null;
  turno: "A" | "B" | null;
};

/** `hasta` inclusive (calendario UTC YYYY-MM-DD). */
export function toExclusiveEndIso(hastaYmd: string): string {
  const d = new Date(`${hastaYmd}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString();
}

export function toStartIso(desdeYmd: string): string {
  return `${desdeYmd}T00:00:00.000Z`;
}

export function defaultDashboardRange(): { desde: string; hasta: string } {
  const hasta = new Date();
  const desde = new Date(hasta);
  desde.setUTCDate(desde.getUTCDate() - 30);
  const fmt = (x: Date) => x.toISOString().slice(0, 10);
  return { desde: fmt(desde), hasta: fmt(hasta) };
}

export function parseDashboardFilters(params: {
  desde?: string | string[];
  hasta?: string | string[];
  maquina?: string | string[];
  turno?: string | string[];
}): DashboardFilters {
  const def = defaultDashboardRange();
  const pick = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const desdeRaw = pick(params.desde);
  const hastaRaw = pick(params.hasta);
  const desde = typeof desdeRaw === "string" && /^\d{4}-\d{2}-\d{2}$/.test(desdeRaw) ? desdeRaw : def.desde;
  const hasta = typeof hastaRaw === "string" && /^\d{4}-\d{2}-\d{2}$/.test(hastaRaw) ? hastaRaw : def.hasta;
  const maqRaw = pick(params.maquina);
  const maquinaId =
    maqRaw != null && maqRaw !== "" && Number.isFinite(Number(maqRaw)) ? Number(maqRaw) : null;
  const turnoRaw = pick(params.turno);
  const turno =
    turnoRaw === "A" || turnoRaw === "B" ? turnoRaw : turnoRaw === "todos" || turnoRaw == null ? null : null;
  return { desde, hasta, maquinaId, turno };
}

export async function fetchDashboardKpis(
  supabase: SupabaseClient,
  filters: DashboardFilters,
): Promise<{ data: KpiDashboard | null; error: string | null }> {
  const { data, error } = await supabase.rpc("fn_kpis_eventos", {
    p_ts_from: toStartIso(filters.desde),
    p_ts_to: toExclusiveEndIso(filters.hasta),
    p_maquina_id: filters.maquinaId,
    p_turno: filters.turno,
  });

  if (error) {
    return { data: null, error: error.message };
  }

  const parsed = kpiDashboardSchema.safeParse(data);
  if (!parsed.success) {
    return { data: null, error: "Respuesta KPI inválida" };
  }
  return { data: parsed.data, error: null };
}

export type ProduccionTrend = {
  ultimos7d_produccion: number;
  previos7d_produccion: number;
  ratio: number | null;
  tendencia: "sube" | "baja" | "estable" | "sin_datos";
};

/**
 * Compara suma de producción en los últimos 7 días calendario UTC vs los 7 anteriores,
 * usando la serie `produccion_por_dia` del RPC.
 */
export function computeProduccionTrend(rows: { dia: string; produccion: number }[]): ProduccionTrend {
  if (rows.length === 0) {
    return {
      ultimos7d_produccion: 0,
      previos7d_produccion: 0,
      ratio: null,
      tendencia: "sin_datos",
    };
  }
  const sorted = [...rows].sort((a, b) => a.dia.localeCompare(b.dia));
  const lastDay = sorted[sorted.length - 1]!.dia;
  const end = new Date(`${lastDay}T00:00:00.000Z`);
  const recentStart = new Date(end);
  recentStart.setUTCDate(recentStart.getUTCDate() - 6);
  const prevEnd = new Date(recentStart);
  prevEnd.setUTCDate(prevEnd.getUTCDate() - 1);
  const prevStart = new Date(prevEnd);
  prevStart.setUTCDate(prevStart.getUTCDate() - 6);

  const inRange = (d: string, a: Date, b: Date) => {
    const x = new Date(`${d}T00:00:00.000Z`);
    return x >= a && x <= b;
  };

  let ultimos7d = 0;
  let previos7d = 0;
  for (const r of sorted) {
    const d = new Date(`${r.dia}T00:00:00.000Z`);
    if (inRange(r.dia, recentStart, end)) ultimos7d += r.produccion;
    if (inRange(r.dia, prevStart, prevEnd)) previos7d += r.produccion;
  }

  const ratio = previos7d > 0 ? ultimos7d / previos7d : ultimos7d > 0 ? null : null;
  let tendencia: ProduccionTrend["tendencia"] = "sin_datos";
  if (ultimos7d === 0 && previos7d === 0) tendencia = "sin_datos";
  else if (ratio == null) tendencia = ultimos7d > 0 ? "sube" : "estable";
  else if (ratio >= 1.08) tendencia = "sube";
  else if (ratio <= 0.92) tendencia = "baja";
  else tendencia = "estable";

  return { ultimos7d_produccion: ultimos7d, previos7d_produccion: previos7d, ratio, tendencia };
}

export function formatDefectoLabel(key: string): string {
  if (key === "(sin_clasificar)") return "Sin clasificar";
  return key.replace(/_/g, " ");
}

export function formatFallaLabel(key: string): string {
  if (key === "(sin_clasificar)") return "Sin clasificar";
  return key.replace(/_/g, " ");
}

export function buildNarrativeSummary(k: KpiDashboard, filters: DashboardFilters): string {
  const trend = computeProduccionTrend(k.produccion_por_dia);
  const topDef = k.defectos_top[0];
  const topFall = k.fallas_maquina_top[0];
  const topMermaMaq = k.merma_por_maquina[0];
  return [
    `Periodo filtrado: ${filters.desde} a ${filters.hasta} (UTC).`,
    filters.maquinaId != null ? `Máquina filtro id=${filters.maquinaId}.` : "Todas las máquinas.",
    filters.turno != null ? `Turno: ${filters.turno}.` : "Todos los turnos.",
    `Producción total: ${k.produccion_total} u.; merma total: ${k.merma_total} u.; % merma sobre producción: ${
      k.pct_merma != null ? `${Number(k.pct_merma).toFixed(2)}%` : "N/A"
    }.`,
    `Pedidos (eventos en rango): creados ${k.pedidos_creados}, completados ${k.pedidos_completados}; cumplimiento ${
      k.cumplimiento_pedidos_pct != null ? `${Number(k.cumplimiento_pedidos_pct).toFixed(1)}%` : "N/A"
    }.`,
    `Tendencia producción (últimos 7d vs 7d previos en serie diaria): ${trend.tendencia}${
      trend.ratio != null ? `, ratio ${trend.ratio.toFixed(2)}` : ""
    }.`,
    topDef
      ? `Defecto líder: ${formatDefectoLabel(topDef.defecto)} (${topDef.unidades} u. en eventos).`
      : "Sin defectos registrados en el filtro.",
    topFall
      ? `Falla máquina más frecuente: ${formatFallaLabel(topFall.falla_maquina)} (${topFall.ocurrencias} eventos).`
      : "Sin fallas de máquina registradas.",
    topMermaMaq
      ? `Merma concentrada: ${topMermaMaq.maquina_codigo ?? topMermaMaq.maquina_nombre ?? "máquina"} (${topMermaMaq.merma_total} u.).`
      : "",
  ]
    .filter(Boolean)
    .join(" ");
}

/** Contexto JSON para el modelo de recomendaciones (datos reales del dashboard). */
export function buildStructuredRecommendationContext(
  k: KpiDashboard,
  filters: DashboardFilters,
): Record<string, unknown> {
  const trend = computeProduccionTrend(k.produccion_por_dia);
  return {
    periodo: { desde: filters.desde, hasta: filters.hasta, zona: "UTC" },
    filtros: {
      maquina_id: filters.maquinaId,
      turno: filters.turno,
    },
    produccion_total_unidades: k.produccion_total,
    merma_total_unidades: k.merma_total,
    pct_merma_sobre_produccion: k.pct_merma != null ? Number(k.pct_merma) : null,
    pedidos: {
      creados_eventos: k.pedidos_creados,
      completados_eventos: k.pedidos_completados,
      cumplimiento_pct: k.cumplimiento_pedidos_pct != null ? Number(k.cumplimiento_pedidos_pct) : null,
      por_estado_tabla: k.pedidos_tabla_por_estado,
    },
    tendencias: {
      produccion_ultimos_7d: trend.ultimos7d_produccion,
      produccion_7d_previos: trend.previos7d_produccion,
      ratio_reciente_vs_anterior: trend.ratio,
      etiqueta: trend.tendencia,
    },
    defectos_frecuentes: k.defectos_top.slice(0, 8).map((d) => ({
      tipo: d.defecto,
      etiqueta: formatDefectoLabel(d.defecto),
      unidades: d.unidades,
      eventos: d.eventos,
    })),
    fallas_maquina: k.fallas_maquina_top.slice(0, 8).map((f) => ({
      tipo: f.falla_maquina,
      etiqueta: formatFallaLabel(f.falla_maquina),
      ocurrencias: f.ocurrencias,
    })),
    merma_por_maquina_top: k.merma_por_maquina.slice(0, 8).map((m) => ({
      maquina_id: m.maquina_id,
      codigo: m.maquina_codigo,
      nombre: m.maquina_nombre,
      merma_unidades: m.merma_total,
    })),
    produccion_por_turno: k.por_turno,
    produccion_por_maquina_top: k.por_maquina.slice(0, 8).map((m) => ({
      maquina_id: m.maquina_id,
      codigo: m.maquina_codigo,
      produccion: m.total_produccion,
    })),
  };
}
